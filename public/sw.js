if (!self.define) {
  let e,
    a = {};
  const s = (s, c) => (
    (s = new URL(s + ".js", c).href),
    a[s] ||
      new Promise((a) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = s), (e.onload = a), document.head.appendChild(e));
        } else ((e = s), importScripts(s), a());
      }).then(() => {
        let e = a[s];
        if (!e) throw new Error(`Module ${s} didn’t register its module`);
        return e;
      })
  );
  self.define = (c, i) => {
    const n =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (a[n]) return;
    let t = {};
    const o = (e) => s(e, n),
      r = { module: { uri: n }, exports: t, require: o };
    a[n] = Promise.all(c.map((e) => r[e] || o(e))).then((e) => (i(...e), t));
  };
}
define(["./workbox-cb477421"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "19be0cb32ac9a9d279b204af663fbc75",
        },
        {
          url: "/_next/static/aHgApMmpFjTIdoShUxYFF/_buildManifest.js",
          revision: "6310079bf1ae7bebeb6a2135896e4564",
        },
        {
          url: "/_next/static/aHgApMmpFjTIdoShUxYFF/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/1068.76dc78addec13492.js",
          revision: "76dc78addec13492",
        },
        {
          url: "/_next/static/chunks/1237-d3642045d915202c.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/1543-d89e4b4ac5241501.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/1617-b7c7182b6525b473.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/164f4fb6-1fc9a4c2b3cae72c.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/1773-0cd6c16862c64efa.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/1809-524b4105d8ff1307.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/1984-3ab0cd42f3ec7dc2.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/2105-3e12438055fc6c7d.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/2117-781fa581501cd167.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/224-4f640b4112ae57f5.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/2255-7a7267d83979d538.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/2270-746daa8e88400d74.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/2336.fe91b1f69e54faa3.js",
          revision: "fe91b1f69e54faa3",
        },
        {
          url: "/_next/static/chunks/2356.518f3f4787460081.js",
          revision: "518f3f4787460081",
        },
        {
          url: "/_next/static/chunks/2455.8af3fae53282fb2c.js",
          revision: "8af3fae53282fb2c",
        },
        {
          url: "/_next/static/chunks/25434b09-b98ca183d17cb47c.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/2600-3ea0c1a9ef4dbc40.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/2647-6db9553cbdead0e9.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/2670-533183d3ddac3c69.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/2672.293909a06e6db0ab.js",
          revision: "293909a06e6db0ab",
        },
        {
          url: "/_next/static/chunks/270.e7e5b7f0a9889d99.js",
          revision: "e7e5b7f0a9889d99",
        },
        {
          url: "/_next/static/chunks/271-0fc5e7f901ccd0cb.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/2892-d911d4a830202fc8.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/2972-37b23406f2604b91.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/2f0b94e8-873f1fff86411cc5.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/3028-915eb715e3e8a2d0.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/3045-4e5040ab8bef7eaf.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/3347-6f1afa9c54a7b249.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/3419-4c009be8cfc5f188.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/3584-ec301654574c740e.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/3719.8db0ba22932d4c48.js",
          revision: "8db0ba22932d4c48",
        },
        {
          url: "/_next/static/chunks/374.32ecb45f0b242265.js",
          revision: "32ecb45f0b242265",
        },
        {
          url: "/_next/static/chunks/3969.d53678042148fc98.js",
          revision: "d53678042148fc98",
        },
        {
          url: "/_next/static/chunks/3996.02a50c2ae159bfde.js",
          revision: "02a50c2ae159bfde",
        },
        {
          url: "/_next/static/chunks/4431-17e7d5d9c479fbcb.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/4438-917b313dc68a463c.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/4446-505537783f29017a.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/446.95f49d5b5fda5386.js",
          revision: "95f49d5b5fda5386",
        },
        {
          url: "/_next/static/chunks/4523-ffc2dc7ab4d0c341.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/4707-a1d75ef755cd2f7c.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/482.cd1b55cff9bbc239.js",
          revision: "cd1b55cff9bbc239",
        },
        {
          url: "/_next/static/chunks/4962-7d72ddecafd2ab48.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/4976-e4cdd79cc7b2494f.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/5201-dafd310a11c53d95.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/5281-c4bf05433f81a439.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/5496-50eebac543f81316.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/5503-ef0bc02c0ddc353b.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/5547.b4589cf33472ac2e.js",
          revision: "b4589cf33472ac2e",
        },
        {
          url: "/_next/static/chunks/5760-39e7eec47d7263e8.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/5763-cd27d3fc297533e2.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/5764-469d56ff00cd538a.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/5865-5ec131fc7c050b9f.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/5883-c4299eefc66581c0.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/6008-85eb8b132319626a.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/6010.6934de67aac2685a.js",
          revision: "6934de67aac2685a",
        },
        {
          url: "/_next/static/chunks/6052-9913b6ff91f491b3.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/6115-a3d9a9d8f6a97aaf.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/6179-2468e5b98ad761c1.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/6284-c57d987225608f97.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/6371-b92d4cd967d1ae41.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/6514-c1f9bb1fbe6d1593.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/6531-5ab687aadf8241a1.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/6555.0eb6b5f7b2eb63c8.js",
          revision: "0eb6b5f7b2eb63c8",
        },
        {
          url: "/_next/static/chunks/6572-6688e16a9010a2c0.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/679-6676f9342e9b06d1.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/7082.9d717842b480915f.js",
          revision: "9d717842b480915f",
        },
        {
          url: "/_next/static/chunks/7084-061d81591ad1a050.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/7181-722a0c9ad4c2236e.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/7264-99209b436856e928.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/7613-960e1d2c955aaeb0.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/7866-5b762f1726542949.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/7989.2d25560be0601db0.js",
          revision: "2d25560be0601db0",
        },
        {
          url: "/_next/static/chunks/8082-056614db7c061e28.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/8090.d822fbab46e5ee56.js",
          revision: "d822fbab46e5ee56",
        },
        {
          url: "/_next/static/chunks/8284.46e33f31f03e1b66.js",
          revision: "46e33f31f03e1b66",
        },
        {
          url: "/_next/static/chunks/8405-359ec18d60071081.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/8569.88003a07b52d3cb2.js",
          revision: "88003a07b52d3cb2",
        },
        {
          url: "/_next/static/chunks/8734-d1b12f0272ac7ac9.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/8758-1a9ab254f00494d1.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/8830.165e8b0fd9170b9d.js",
          revision: "165e8b0fd9170b9d",
        },
        {
          url: "/_next/static/chunks/8848.1c984873cd4f7972.js",
          revision: "1c984873cd4f7972",
        },
        {
          url: "/_next/static/chunks/9037-49973d9550441c04.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/9267-8ab081208d6f6d1e.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/9316.edeb4299e4f66e73.js",
          revision: "edeb4299e4f66e73",
        },
        {
          url: "/_next/static/chunks/9501-1a6acb8bee0360de.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/9613-da323eb770cd142d.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/9714.2f39acfe06c0e805.js",
          revision: "2f39acfe06c0e805",
        },
        {
          url: "/_next/static/chunks/98-d9c9b78688f7c759.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/ad2866b8.df424f64adfa702a.js",
          revision: "df424f64adfa702a",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(auth)/auth/login/page-29f7da4073891580.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(auth)/layout-de336aa40b7cc267.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/account/page-e914caf708ba5ef3.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/announcements-admin/page-32284b57c127f8c7.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/announcements/page-e1b59111211e1abd.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/assets/page-a94416588824937b.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/attendance/page-1c86d004d956117f.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/audit/page-6c80340ec41d2689.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/dashboard/page-19781b770e861e76.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/evaluation/page-afd83161dd68b5dc.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/health/page-bfcdcee39f9bb2b7.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/health/stress-check/take/page-2e59694ebebc52a6.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/layout-95288ac14eee902a.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/leave/page-789f47b08238671d.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/legal-updates/page-7ed13220bc3f52b9.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/members/page-ed3153f3215b50a3.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding-admin/%5BapplicationId%5D/page-2e4ae651dd91b259.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding-admin/page-df47f6980be5c163.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding/%5BapplicationId%5D/bank-account/page-90ec62cda83e01d1.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding/%5BapplicationId%5D/basic-info/page-e5104f1ef4271250.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding/%5BapplicationId%5D/commute-route/page-0553025c856b99d5.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding/%5BapplicationId%5D/family-info/page-a2b2a4134f686c50.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding/layout-da0cd6f44d3423f1.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding/page-b7de65f9f835cdd7.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/organization/page-9b9c286b9c382280.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/payroll/page-ec245ba3ac197c48.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/profile/page-f470447746809cdc.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/saas/%5Bid%5D/page-6b16e5572ce7fb75.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/saas/departments/page-3e01bda195e533d2.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/saas/page-bec7ee637b9d107f.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/saas/users/page-4505a667c848e07f.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/scheduled-changes/page-3be38b4a63e32f1e.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/settings/page-7cc0c54e35e15fcb.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/users/%5Bid%5D/page-a2380d80e06ff957.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/users/page-9976cab3712fb9e0.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/workflow/page-b38dbc1efeaf5841.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/layout-4e24f9e85971d5fb.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/not-found-d243848d491a87fd.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/page-5afebe6dea15f2a9.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-b7f2a623e0db00d1.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/dw-admin/dashboard/page-672168ec8a6d7cbf.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/dw-admin/invoices/%5Bid%5D/page-ce6fcc0ddb572caa.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/dw-admin/notifications/%5Bid%5D/page-7c68ed04c9eec1bc.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/dw-admin/tenants/%5Bid%5D/page-3f3d5fe27ed37b24.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/dw-admin/tenants/page-0d3535d3a839f801.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/error-7a2f017db210954c.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/layout-261463807a2907c2.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/not-found-ff5721cdc0c31188.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/app/page-d0d02c78e1c18fa9.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/bc98253f.5b0f4fe717c5b99c.js",
          revision: "5b0f4fe717c5b99c",
        },
        {
          url: "/_next/static/chunks/fd9d1056-5d6830abed5d6364.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/framework-8e0e0f4a6b83a956.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/main-15bc61bb4e59bd2c.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/main-app-a224c2132c1fe10e.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/pages/_app-3c9ca398d360b709.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/pages/_error-cf5ca766ac8f493f.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-eefde21826ddb869.js",
          revision: "aHgApMmpFjTIdoShUxYFF",
        },
        {
          url: "/_next/static/css/646f8694e02dbe6d.css",
          revision: "646f8694e02dbe6d",
        },
        {
          url: "/_next/static/css/87951c4b4cc3a3a2.css",
          revision: "87951c4b4cc3a3a2",
        },
        {
          url: "/_next/static/media/19cfc7226ec3afaa-s.woff2",
          revision: "9dda5cfc9a46f256d0e131bb535e46f8",
        },
        {
          url: "/_next/static/media/21350d82a1f187e9-s.woff2",
          revision: "4e2553027f1d60eff32898367dd4d541",
        },
        {
          url: "/_next/static/media/8e9860b6e62d6359-s.woff2",
          revision: "01ba6c2a184b8cba08b0d57167664d75",
        },
        {
          url: "/_next/static/media/ba9851c3c22cd980-s.woff2",
          revision: "9e494903d6b0ffec1a1e14d34427d44d",
        },
        {
          url: "/_next/static/media/c5fe6dc8356a8c31-s.woff2",
          revision: "027a89e9ab733a145db70f09b8a18b42",
        },
        {
          url: "/_next/static/media/df0a9ae256c0569c-s.woff2",
          revision: "d54db44de5ccb18886ece2fda72bdfe0",
        },
        {
          url: "/_next/static/media/e4af272ccee01ff0-s.p.woff2",
          revision: "65850a373e258f1c897a2b3d75eb74de",
        },
        {
          url: "/avatars/default.png",
          revision: "511662d56cc004e8485804f3455891cb",
        },
        {
          url: "/dandori-logo-small.jpg",
          revision: "112eacce95797ad11116645d27a5a7a6",
        },
        {
          url: "/dandori-logo.jpg",
          revision: "30cbdd4c2f51e7854fbef1d79b20bfe8",
        },
        {
          url: "/dandori-work-logo.jpg",
          revision: "aff39d48c1c872dd66f288696e11428c",
        },
        { url: "/favicon.ico", revision: "352d9bd0d2fd81d5382653e3af79d698" },
        { url: "/favicon.png", revision: "48446a34057fadf68cfe496c7d9135a0" },
        { url: "/favicon.svg", revision: "273ec3b8266a7852a69fc357ba807674" },
        {
          url: "/fonts/NotoSansJP-Regular.ttf",
          revision: "f11bfc28629ade532e6e551e69d444f9",
        },
        {
          url: "/icons/apple-touch-icon.png",
          revision: "fe18802692a22c1895ca36350f77cf6d",
        },
        {
          url: "/icons/apple-touch-icon.svg",
          revision: "6722c58d13d3426392ebb867107b80d0",
        },
        {
          url: "/icons/icon-128x128.png",
          revision: "f0092ef3f8b1b93e159dc4ad389e560f",
        },
        {
          url: "/icons/icon-128x128.svg",
          revision: "4144ae65c4c3342ba7bfad08636739ae",
        },
        {
          url: "/icons/icon-144x144.png",
          revision: "8410916cf9065c3232c595354006420e",
        },
        {
          url: "/icons/icon-144x144.svg",
          revision: "347be07d68a94b3e4fdec18ee5b4c011",
        },
        {
          url: "/icons/icon-152x152.png",
          revision: "601c2bce990b603570713acba84626fe",
        },
        {
          url: "/icons/icon-152x152.svg",
          revision: "b9e13f4d224303f1338bec05568198eb",
        },
        {
          url: "/icons/icon-192x192.png",
          revision: "1286b337e02b509a96a5c3a33a809256",
        },
        {
          url: "/icons/icon-192x192.svg",
          revision: "474dd6f9ebb8bc113303312423600adf",
        },
        {
          url: "/icons/icon-384x384.png",
          revision: "14252562ec502b8c4344734107e70d3f",
        },
        {
          url: "/icons/icon-384x384.svg",
          revision: "b541f631d804bdf6196b6f6c9cbce5c8",
        },
        {
          url: "/icons/icon-512x512.png",
          revision: "99bae022ef467f0e4f0522dafa736098",
        },
        {
          url: "/icons/icon-512x512.svg",
          revision: "ea849616df82adcce16a3f7cee7237ae",
        },
        {
          url: "/icons/icon-72x72.png",
          revision: "533ce78a3b4669411ad6e7ff2a91ca86",
        },
        {
          url: "/icons/icon-72x72.svg",
          revision: "894950b3d0878ff2a201dc37d1eb2526",
        },
        {
          url: "/icons/icon-96x96.png",
          revision: "ca5503e35fdad4ef059552208d49dc9e",
        },
        {
          url: "/icons/icon-96x96.svg",
          revision: "f1dfed38fc90753cc13be06bc5158b91",
        },
        { url: "/manifest.json", revision: "b3c30d9ebfe5f4482251ef26cad924f2" },
        {
          url: "/mockServiceWorker.js",
          revision: "c1c6b48b4d03254de8baf1e7c959ca31",
        },
        { url: "/offline.html", revision: "cf5df5d390686ea958cbb0c3d6bdbe9a" },
        { url: "/robots.txt", revision: "f77c87f977e0fcce05a6df46c885a129" },
      ],
      { ignoreURLParametersMatching: [] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: a,
              event: s,
              state: c,
            }) =>
              a && "opaqueredirect" === a.type
                ? new Response(a.body, {
                    status: 200,
                    statusText: "OK",
                    headers: a.headers,
                  })
                : a,
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https?.*/,
      new e.NetworkFirst({
        cacheName: "offlineCache",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ));
});
