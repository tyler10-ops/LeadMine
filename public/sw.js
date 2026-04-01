// LeadMine Service Worker — handles web push notifications

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "LeadMine", body: event.data.text() };
  }

  const options = {
    body:    payload.body  ?? "Open your War Room for today's briefing.",
    icon:    payload.icon  ?? "/icon-192.png",
    badge:   payload.badge ?? "/badge-72.png",
    data:    payload.data  ?? { url: "/dashboard/war-room" },
    actions: [
      { action: "open",    title: "Open War Room" },
      { action: "dismiss", title: "Dismiss" },
    ],
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "LeadMine War Room", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url ?? "/dashboard/war-room";
  const fullUrl = new URL(url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()));
