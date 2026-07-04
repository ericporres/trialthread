import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";

const f = (p) => readFileSync(new URL(`./node_modules/${p}`, import.meta.url));
const fonts = [
  { name: "Newsreader", data: f("@fontsource/newsreader/files/newsreader-latin-600-normal.woff"), weight: 600, style: "normal" },
  { name: "Newsreader", data: f("@fontsource/newsreader/files/newsreader-latin-500-normal.woff"), weight: 500, style: "normal" },
  { name: "Public Sans", data: f("@fontsource/public-sans/files/public-sans-latin-400-normal.woff"), weight: 400, style: "normal" },
];

const el = {
  type: "div",
  props: {
    style: {
      width: 1200, height: 630, display: "flex", flexDirection: "column",
      justifyContent: "space-between", backgroundColor: "#FBFAF8",
      padding: "72px 84px 60px",
    },
    children: [
      {
        type: "div",
        props: {
          style: { display: "flex", flexDirection: "column" },
          children: [
            {
              type: "div",
              props: {
                style: { display: "flex", fontFamily: "Newsreader", fontWeight: 600, fontSize: 64, letterSpacing: "-0.01em" },
                children: [
                  { type: "span", props: { style: { color: "#1E1B18" }, children: "Trial" } },
                  { type: "span", props: { style: { color: "#0E7C6E" }, children: "Thread" } },
                ],
              },
            },
            { type: "div", props: { style: { width: 64, height: 4, backgroundColor: "#0E7C6E", marginTop: 18 } } },
          ],
        },
      },
      {
        type: "div",
        props: {
          style: {
            fontFamily: "Newsreader", fontWeight: 500, fontSize: 76, lineHeight: 1.12,
            color: "#1E1B18", maxWidth: 1000, letterSpacing: "-0.005em",
          },
          children: "Describe the diagnosis. We’ll read the trials you’d never find on your own.",
        },
      },
      {
        type: "div",
        props: {
          style: { fontFamily: "Public Sans", fontWeight: 400, fontSize: 27, color: "#8A8377" },
          children: "Free · No account · Nothing you type is stored · Patients never pay",
        },
      },
    ],
  },
};

const svg = await satori(el, { width: 1200, height: 630, fonts });
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
writeFileSync(new URL("./og.png", import.meta.url), png);
console.log("og.png", png.length, "bytes");
