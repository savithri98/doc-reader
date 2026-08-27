/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mammoth", "pdfkit", "tesseract.js", "pdf-to-img"],
};

export default nextConfig;
