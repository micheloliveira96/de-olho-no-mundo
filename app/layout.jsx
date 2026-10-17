import "./globals.css";

export const metadata = {
  title: "De Olho no Mundo",
  description: "Acompanha câmbio, criptomoedas e mercados financeiros num só lugar."
};

export default function RootLayout({ children }) {
  return <html lang="pt-PT"><body>{children}</body></html>;
}
