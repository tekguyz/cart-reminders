# Words used here

- **Cart Reminders**: the app. Its landing page sells it; its demo plays Segovia Coffee.
- **Segovia Coffee**: the made-up Sample Business, a small roaster in Miami that roasts coffee from Nicaragua. Renamed from Coquimba Coffee on 2026-11-20, because Coquimba Coffee is a real TEKGUYZ app (`tekguyz/coquimba-coffee`). Searched 2026-11-20: no coffee roaster uses the name.
- **Visitor**: someone trying the demo. They play Dana, a shopper, and the store owner.
- **Cart**: a real Shopify cart on the development store. One per visitor per "Reset demo".
- **Left**: the visitor pressed "Leave without paying" at checkout. The Stripe session is expired.
- **Reminder**: the email and text the store would send to a left cart. Drawn on screen, never sent. First after 1 hour, second after 24 hours, on the demo clock.
- **Won back**: a cart that was reminded and then paid.
- **Demo clock**: minutes kept on the cart; "Skip ahead" moves it to the next reminder.
