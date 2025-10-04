// Located in: src/lib/utils.ts
export const getURL = (path = "") => {
  let url = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "http://localhost:3000/";

  url = url.includes("http") ? url : `https://${url}`;
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;

  if (path && path.startsWith("/")) {
    path = path.substring(1);
  }

  return `${url}${path}`;
};
