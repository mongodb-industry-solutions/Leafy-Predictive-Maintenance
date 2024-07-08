import "./globals.css";
import { GeistSans } from "geist/font/sans";

export const metadata = {
  title: "Predictive Maintenance",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>{children}</body>
    </html>
  );
}
