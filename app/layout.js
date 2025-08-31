import { Geist, Geist_Mono, Gabarito } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Navigation from "@/components/ui/factory/navigation/Navigation";
import Footer from "@/components/ui/factory/footer/Footer";
import { CartProvider } from "@/components/providers/CartProvider";
import { Toaster } from "@/components/ui/sonner";
import { getServerSession } from "@/lib/auth-actions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});
const gabarito = Gabarito({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Clothing Clothes",
  description: "A clothing store built with Next.js and Tailwind CSS",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${gabarito.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <CartProvider>
            <Navigation session={session} />
            {children}
            <Footer />
          </CartProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
