import "./globals.css";

export const metadata = {
  title: "Document Translator | Kannada & Hindi to English",
  description: "Seamlessly translate text from your Word & PDF documents to English. Experience flawless meaning retention and instant PDF downloading. High quality automatic translations.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
