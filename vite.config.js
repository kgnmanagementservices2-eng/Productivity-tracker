// // import { defineConfig } from "vite";
// // import react from "@vitejs/plugin-react";

// // export default defineConfig({
// //   plugins: [react()],
// //   server: {
// //     host: true,
// //     port: 5173,
// //     allowedHosts: [".loca.lt"],
// //   },
// // });
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     host: true,
//     port: 5173,
//     allowedHosts: [".loca.lt"],
//     proxy: {
//       "/api": {
//         target:
//           "http://ticket-tracker-env.eba-tdt98axn.eu-north-1.elasticbeanstalk.com",
//         changeOrigin: true,
//         secure: false,
//       },
//       "/socket.io": {
//         target:
//           "http://ticket-tracker-env.eba-tdt98axn.eu-north-1.elasticbeanstalk.com",
//         ws: true,
//         changeOrigin: true,
//       },
//     },
//   },
// });
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [".loca.lt"],
    proxy: {
      "/api": {
        target:
          "http://ticket-tracker-env.eba-tdt98axn.eu-north-1.elasticbeanstalk.com",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target:
          "http://ticket-tracker-env.eba-tdt98axn.eu-north-1.elasticbeanstalk.com",
        ws: true,
        changeOrigin: true,
        secure: false,
        // 🔥 Add these parameters to handle slow/dropped socket writes gracefully
        timeout: 60000,
        proxyTimeout: 60000,
      },
    },
  },
});
