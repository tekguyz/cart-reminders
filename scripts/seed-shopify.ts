// Loads the Coquimba Coffee catalog (lib/catalog/products.json) into the
// Shopify development store in .env.local. Safe to rerun: products are found
// by handle and updated, never duplicated.
//
//   npm run seed:shopify
//
// What it does, in order:
// 1. Metafield definitions `coquimba.*`, readable by the Storefront API.
// 2. Each product, untracked stock, with its variants and metafields.
// 3. Its label picture, drawn from lib/brand/marks.ts and rendered to PNG.
// 4. Publishes each product to the Headless channel (or every channel the app can see).

import { Resvg } from "@resvg/resvg-js";
import catalog from "../lib/catalog/products.json";
import { drawingSvg, type Drawing } from "../lib/brand/marks";
import { adminTokenSource } from "../lib/shopify/admin";
import { SHOPIFY_API_VERSION } from "../lib/shopify/version";

const domain = process.env.SHOPIFY_STORE_DOMAIN;
if (!domain) throw new Error("Set SHOPIFY_STORE_DOMAIN in .env.local");
const token = adminTokenSource(process.env);

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`https://${domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": await token() },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (!res.ok || json.errors) throw new Error(`Shopify ${res.status}: ${JSON.stringify(json.errors ?? json)}`);
  return json.data as T;
}

function userErrors(where: string, errs: { message: string }[] | undefined) {
  if (errs?.length) throw new Error(`${where}: ${errs.map((e) => e.message).join("; ")}`);
}

const FIELDS: { key: string; name: string; type: string }[] = [
  { key: "region", name: "Region", type: "single_line_text_field" },
  { key: "notes", name: "Tasting notes", type: "single_line_text_field" },
  { key: "pickup_only", name: "Pickup only", type: "boolean" },
  { key: "band", name: "Label color", type: "single_line_text_field" },
  { key: "drawing", name: "Label drawing", type: "single_line_text_field" },
];

async function definitions() {
  for (const f of FIELDS) {
    const d = await gql<{ metafieldDefinitionCreate: { userErrors: { message: string; code?: string }[] } }>(
      `mutation($d: MetafieldDefinitionInput!) { metafieldDefinitionCreate(definition: $d) { userErrors { message code } } }`,
      { d: { namespace: "coquimba", key: f.key, name: f.name, type: f.type, ownerType: "PRODUCT", access: { storefront: "PUBLIC_READ" } } },
    );
    const errs = d.metafieldDefinitionCreate.userErrors.filter((e) => e.code !== "TAKEN");
    userErrors(`definition ${f.key}`, errs);
  }
  console.log("Metafield definitions ready.");
}

async function uploadPng(handle: string, svg: string): Promise<string> {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 800 }, background: "#F4EBDC" }).render().asPng();
  const s = await gql<{ stagedUploadsCreate: { stagedTargets: { url: string; resourceUrl: string; parameters: { name: string; value: string }[] }[]; userErrors: { message: string }[] } }>(
    `mutation($input: [StagedUploadInput!]!) { stagedUploadsCreate(input: $input) { stagedTargets { url resourceUrl parameters { name value } } userErrors { message } } }`,
    { input: [{ filename: `${handle}.png`, mimeType: "image/png", resource: "IMAGE", httpMethod: "POST", fileSize: String(png.length) }] },
  );
  userErrors("staged upload", s.stagedUploadsCreate.userErrors);
  const t = s.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const p of t.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([new Uint8Array(png)], { type: "image/png" }), `${handle}.png`);
  const up = await fetch(t.url, { method: "POST", body: form });
  if (!up.ok) throw new Error(`Upload ${handle}: ${up.status}`);
  return t.resourceUrl;
}

async function publicationIds(): Promise<string[]> {
  const d = await gql<{ publications: { nodes: { id: string; name: string }[] } }>(`query { publications(first: 20) { nodes { id name } } }`);
  const headless = d.publications.nodes.filter((p) => /headless/i.test(p.name));
  return (headless.length ? headless : d.publications.nodes).map((p) => p.id);
}

async function products() {
  const pubs = await publicationIds();
  for (const p of catalog.products) {
    const found = await gql<{ productByIdentifier: { id: string; media: { nodes: { id: string }[] } } | null }>(
      `query($h: String!) { productByIdentifier(identifier: { handle: $h }) { id media(first: 5) { nodes { id } } } }`,
      { h: p.handle },
    );
    const existing = found.productByIdentifier;
    const image = existing?.media.nodes.length ? null : await uploadPng(p.handle, drawingSvg(p.drawing as Drawing, p.band));
    const optionName = p.variants.length > 1 || p.variants[0].title.includes("·") ? "Size and grind" : "Size";
    const input = {
      ...(existing ? { id: existing.id } : {}),
      title: p.title,
      handle: p.handle,
      status: "ACTIVE",
      vendor: "Coquimba Coffee",
      productType: p.pickupOnly ? "Roastery" : "Coffee",
      descriptionHtml: `<p>${p.notes}</p>`,
      productOptions: [{ name: optionName, values: p.variants.map((v) => ({ name: v.title })) }],
      variants: p.variants.map((v) => ({
        optionValues: [{ optionName, name: v.title }],
        price: (v.price / 100).toFixed(2),
        inventoryPolicy: "CONTINUE",
        inventoryItem: { tracked: false },
      })),
      metafields: [
        { namespace: "coquimba", key: "region", type: "single_line_text_field", value: p.region ?? "" },
        { namespace: "coquimba", key: "notes", type: "single_line_text_field", value: p.notes },
        { namespace: "coquimba", key: "pickup_only", type: "boolean", value: String(p.pickupOnly) },
        { namespace: "coquimba", key: "band", type: "single_line_text_field", value: p.band },
        { namespace: "coquimba", key: "drawing", type: "single_line_text_field", value: p.drawing },
      ].filter((m) => m.value !== ""),
      ...(image ? { files: [{ originalSource: image, contentType: "IMAGE", alt: `${p.title} label` }] } : {}),
    };
    const r = await gql<{ productSet: { product: { id: string } | null; userErrors: { message: string }[] } }>(
      `mutation($input: ProductSetInput!) { productSet(input: $input, synchronous: true) { product { id } userErrors { message } } }`,
      { input },
    );
    userErrors(`product ${p.handle}`, r.productSet.userErrors);
    const id = r.productSet.product!.id;
    const pub = await gql<{ publishablePublish: { userErrors: { message: string }[] } }>(
      `mutation($id: ID!, $input: [PublicationInput!]!) { publishablePublish(id: $id, input: $input) { userErrors { message } } }`,
      { id, input: pubs.map((publicationId) => ({ publicationId })) },
    );
    userErrors(`publish ${p.handle}`, pub.publishablePublish.userErrors);
    console.log(`${existing ? "Updated" : "Created"} ${p.title}`);
  }
}

await definitions();
await products();
console.log("Catalog loaded.");
