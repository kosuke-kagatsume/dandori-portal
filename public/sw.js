if (!self.define) {
  let a,
    c = {};
  const e = (e, i) => (
    (e = new URL(e + ".js", i).href),
    c[e] ||
      new Promise((c) => {
        if ("document" in self) {
          const a = document.createElement("script");
          ((a.src = e), (a.onload = c), document.head.appendChild(a));
        } else ((a = e), importScripts(e), c());
      }).then(() => {
        let a = c[e];
        if (!a) throw new Error(`Module ${e} didn’t register its module`);
        return a;
      })
  );
  self.define = (i, s) => {
    const n =
      a ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (c[n]) return;
    let t = {};
    const l = (a) => e(a, n),
      r = { module: { uri: n }, exports: t, require: l };
    c[n] = Promise.all(i.map((a) => r[a] || l(a))).then((a) => (s(...a), t));
  };
}
define(["./workbox-cb477421"], function (a) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    a.clientsClaim(),
    a.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "314d0be397a7bfea4ca22b481bb885ac",
        },
        {
          url: "/_next/static/_ZLIiHma_j0pWacJvl32R/_buildManifest.js",
          revision: "6310079bf1ae7bebeb6a2135896e4564",
        },
        {
          url: "/_next/static/_ZLIiHma_j0pWacJvl32R/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/1199-81f4a1cd04ba6006.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/130-2c1ed0d58bb55df7.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/1531-6881505d7e7fb722.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/1543-d89e4b4ac5241501.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/164f4fb6-1fc9a4c2b3cae72c.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/1787-869653ad2d9f4a6d.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/2011-1c01921929b2926d.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/2105-50645335bc8f0916.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/2117-781fa581501cd167.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/2227.4c3314da66c90496.js",
          revision: "4c3314da66c90496",
        },
        {
          url: "/_next/static/chunks/224-4f640b4112ae57f5.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/2255-7a7267d83979d538.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/2270-746daa8e88400d74.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/2356.bb8bc56347f34e52.js",
          revision: "bb8bc56347f34e52",
        },
        {
          url: "/_next/static/chunks/2523-ea5885839896deff.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/25434b09-5dd22e6d2f389204.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/2647-6db9553cbdead0e9.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/2663.e754cfd918c4c57f.js",
          revision: "e754cfd918c4c57f",
        },
        {
          url: "/_next/static/chunks/2672.0d63afd0955aed55.js",
          revision: "0d63afd0955aed55",
        },
        {
          url: "/_next/static/chunks/271-0fc5e7f901ccd0cb.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/2828-8e740d557aded8b1.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/2902-3066cab2ba7ca753.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/2972-37b23406f2604b91.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/2f0b94e8-873f1fff86411cc5.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/3028-915eb715e3e8a2d0.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/3045-e952dcc2c42b4128.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/3268-94416756466adf85.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/3418-64ab4f1251484d7d.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/3419-b5aac8bfa077b1b3.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/3719.8db0ba22932d4c48.js",
          revision: "8db0ba22932d4c48",
        },
        {
          url: "/_next/static/chunks/375-e6ab8e541426f0fb.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/377-3801bf7d2902689f.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/3969.b6c411467ff11a43.js",
          revision: "b6c411467ff11a43",
        },
        {
          url: "/_next/static/chunks/4343-5b964813e106a6b5.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/4387-e1e3e4340dd53c67.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/4438-917b313dc68a463c.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/4446-505537783f29017a.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/446.95f49d5b5fda5386.js",
          revision: "95f49d5b5fda5386",
        },
        {
          url: "/_next/static/chunks/4496-9008097fe9b5e68e.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/4554.ffe606e825e74968.js",
          revision: "ffe606e825e74968",
        },
        {
          url: "/_next/static/chunks/4707-b121f1d82504181d.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/471.ea4c02b3e2456377.js",
          revision: "ea4c02b3e2456377",
        },
        {
          url: "/_next/static/chunks/482.41ad122e636257cb.js",
          revision: "41ad122e636257cb",
        },
        {
          url: "/_next/static/chunks/4962-7d72ddecafd2ab48.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/4976-38ce3592eeccedc4.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/5111-890a2f173f375f83.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/5166-160cb719c83d762c.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/5184-f7f43df53ff87085.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/5253-94a1eedc9b550fa0.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/531-72eef744fc87aba2.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/537.f8a91bb58fbd186a.js",
          revision: "f8a91bb58fbd186a",
        },
        {
          url: "/_next/static/chunks/5383-6279da7c973252be.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/5413-f6402ea00ae7c5f4.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/5547.b4589cf33472ac2e.js",
          revision: "b4589cf33472ac2e",
        },
        {
          url: "/_next/static/chunks/5601-1920c14df232995e.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/5760-f04abfc09a008b79.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/5763-cd27d3fc297533e2.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/5865-5ec131fc7c050b9f.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/588.f0b29e1bef7766a0.js",
          revision: "f0b29e1bef7766a0",
        },
        {
          url: "/_next/static/chunks/5883-c4299eefc66581c0.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/6008-85eb8b132319626a.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/6010.fc21933b07abda07.js",
          revision: "fc21933b07abda07",
        },
        {
          url: "/_next/static/chunks/6045-b5ce99382ec1a089.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/6052-9913b6ff91f491b3.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/6371-b92d4cd967d1ae41.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/6514-5ebe27a29b3aa306.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/6572-6688e16a9010a2c0.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/6697-c1ca07b8ab9e105a.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/6737-cf616336d77e772d.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/6748.31e08a3ded772f77.js",
          revision: "31e08a3ded772f77",
        },
        {
          url: "/_next/static/chunks/6785-0e3b359e1260724a.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/6843-25b96104dbc498d5.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/6881.f760f261d942cf7c.js",
          revision: "f760f261d942cf7c",
        },
        {
          url: "/_next/static/chunks/7244.7c6ac0228747a47c.js",
          revision: "7c6ac0228747a47c",
        },
        {
          url: "/_next/static/chunks/7580-912551e1a9f74edd.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/7669.f6e7269178e40145.js",
          revision: "f6e7269178e40145",
        },
        {
          url: "/_next/static/chunks/8090.289a4fd35b4699e4.js",
          revision: "289a4fd35b4699e4",
        },
        {
          url: "/_next/static/chunks/8134-ccf83d3b7b7e134b.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/8284.ecc0072b28bb33b4.js",
          revision: "ecc0072b28bb33b4",
        },
        {
          url: "/_next/static/chunks/8385-e4490b9e9b7fd21b.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/846-db161b608865ba8b.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/8743-aa858893fc23224f.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/8758-1a9ab254f00494d1.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
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
          url: "/_next/static/chunks/8941-07d7e4ff46fe8221.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/8955-a2862fbf04ee3fea.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/9090.0e0240defef1c957.js",
          revision: "0e0240defef1c957",
        },
        {
          url: "/_next/static/chunks/9257.015a6035163159d6.js",
          revision: "015a6035163159d6",
        },
        {
          url: "/_next/static/chunks/9316.4b321997ceb07257.js",
          revision: "4b321997ceb07257",
        },
        {
          url: "/_next/static/chunks/9391-ba4ba1be8cb40600.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/9501-1a6acb8bee0360de.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/9613-b3f57bf94b384f3d.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/98-d9c9b78688f7c759.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/9942-fac3ca02b9d55717.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/9961-14cc1e95cde17f78.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/ad2866b8-541c6da306f68f23.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(auth)/auth/change-password/page-c465122e7961c307.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(auth)/auth/login/page-6f4b2cb1ebd70fbf.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(auth)/auth/proxy-login/page-d81da1ddc5b0e64a.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(auth)/layout-de336aa40b7cc267.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/account/page-6f4daa7736b6c5dc.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/announcements-admin/page-a018c98be7b68bb1.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/announcements/page-99947e1b69239a41.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/assets/page-fe7b20c2be7412f8.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/attendance/page-ea4c040b0bcccf13.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/audit/page-634685d1e916a348.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/dashboard/page-458dc98cd3553eb9.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/evaluation/page-a5f6289942705e57.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/health/page-e5a559eb182862c9.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/health/stress-check/take/page-f5538f73f12d7b74.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/layout-6188fe2a909c9f88.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/leave/page-5b6034b5421ef563.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/legal-updates/page-b63daec819e0a414.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/members/page-50c77341d8721d45.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding-admin/%5BapplicationId%5D/page-92901c8b76c18be1.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding-admin/page-247222471ba0dd5b.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding/%5BapplicationId%5D/bank-account/page-90ec62cda83e01d1.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding/%5BapplicationId%5D/basic-info/page-a3c10ab0109e80f5.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding/%5BapplicationId%5D/commute-route/page-0553025c856b99d5.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding/%5BapplicationId%5D/family-info/page-a65d5a75df17bdc3.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding/layout-da0cd6f44d3423f1.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/onboarding/page-a4bab59aa6340c08.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/organization/page-8c16fb8210def1d1.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/payroll/page-7119000ccd9fc1e7.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/profile/page-108313b354b41f68.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/saas/%5Bid%5D/page-6bb81ba0cde0c293.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/saas/departments/page-f00360fd4df5d5e8.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/saas/page-90271aa010eb921e.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/saas/users/page-2b0a7fa31e709de0.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/scheduled-changes/page-b96f05cec41ad3e1.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/settings/page-572824595f179831.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/users/%5Bid%5D/page-e3eb40f70078cf4a.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/users/page-e01450d708a89c3c.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/(portal)/workflow/page-09f8fef8fdd232b3.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/layout-33ceee1c71028c69.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/not-found-d243848d491a87fd.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/%5Blocale%5D/page-5afebe6dea15f2a9.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-b7f2a623e0db00d1.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/dw-admin/dashboard/page-8265c5deee034561.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/dw-admin/invoices/%5Bid%5D/page-5bf8cc5ef106e534.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/dw-admin/login/page-128ceb46d0a8ba82.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/dw-admin/notifications/%5Bid%5D/page-0ad48388afbd6ace.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/dw-admin/tenants/%5Bid%5D/page-4348666e988b5b21.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/dw-admin/tenants/page-c468c9c0807b937c.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/error-4e80fa820f77c7bd.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/layout-261463807a2907c2.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/not-found-ff5721cdc0c31188.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/page-d0d02c78e1c18fa9.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/app/tenant-not-found/page-107caf33da070c8d.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/bc98253f.5b0f4fe717c5b99c.js",
          revision: "5b0f4fe717c5b99c",
        },
        {
          url: "/_next/static/chunks/fd9d1056-5d6830abed5d6364.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/framework-8e0e0f4a6b83a956.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/main-3498e17d58f1af7e.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/main-app-a224c2132c1fe10e.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/pages/_app-3c9ca398d360b709.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/pages/_error-cf5ca766ac8f493f.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-49e298bee7510128.js",
          revision: "_ZLIiHma_j0pWacJvl32R",
        },
        {
          url: "/_next/static/css/0e6fc3a2d7c2afe4.css",
          revision: "0e6fc3a2d7c2afe4",
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
    a.cleanupOutdatedCaches(),
    a.registerRoute(
      "/",
      new a.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: a,
              response: c,
              event: e,
              state: i,
            }) =>
              c && "opaqueredirect" === c.type
                ? new Response(c.body, {
                    status: 200,
                    statusText: "OK",
                    headers: c.headers,
                  })
                : c,
          },
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /^https?.*/,
      new a.NetworkFirst({
        cacheName: "offlineCache",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ));
});
