/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mammoth", "pdfkit", "unpdf", "tesseract.js", "pdf-to-img"],
};

export default nextConfig;
