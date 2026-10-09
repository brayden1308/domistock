import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font" });
export const metadata = { title: "DomiStock", description: "Inventario y ventas para tu tienda" };
export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={font.variable} suppressHydrationWarning>{children}</body>
    </html>
  );
}
