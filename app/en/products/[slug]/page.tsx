import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "../../../lib/products";
import { getProductSchema, getBreadcrumbSchema } from "../../../lib/schema";
import { LanguageToggle } from "@/app/components/LanguageToggle";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);

  if (!product) return {};

  const title = `${product.name} | FELICITY COFFEE ROASTERS`;
  const description = `${product.country} — ${product.process} — ${product.weight} ${product.price}`;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.country,
      "Coffee Beans",
      "Specialty Coffee",
      product.process,
      product.roast,
      "Hayama",
    ],
    alternates: {
      canonical: `https://felicity.cafe/en/products/${slug}`,
      languages: {
        en: `https://felicity.cafe/en/products/${slug}`,
        ja: `https://felicity.cafe/ja/products/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://felicity.cafe/en/products/${slug}`,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: product.image,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
  };
}

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductPageEN({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  const specs = [
    { label: "Origin", value: product.country },
    { label: "Process", value: product.process },
    { label: "Roast Level", value: product.roast },
    { label: "Roast Profile", value: product.roastProfile },
    { label: "Machine", value: product.machine },
    { label: "Weight", value: product.weight },
    { label: "Price", value: product.price },
    { label: "GTIN", value: product.gtin },
  ];

  // Generate schemas
  const productSchema = getProductSchema(
    product.name,
    product.country,
    product.process,
    product.price,
    product.weight,
    product.gtin,
    "en"
  );

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "https://felicity.cafe/en/" },
    { name: "Coffee", url: "https://felicity.cafe/en/#coffee" },
    { name: product.name, url: `https://felicity.cafe/en/products/${slug}` },
  ]);

  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [productSchema, breadcrumbSchema],
  };

  return (
    <main className="min-h-screen bg-[#F4EFE4]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b border-[#DDD5C5] px-8 py-5">
        <div className="max-w-6xl mx-auto flex justify-between items-baseline">
          <div className="flex items-center gap-8">
            <p className="font-mono text-[11px] tracking-[0.22em] text-[#2C2416] uppercase">
              Felicity Coffee Roasters
              <span className="mx-3 text-[#CCCCCC]">/</span>
              <span className="text-[#999]">Hayama, Japan</span>
            </p>
          </div>
          <LanguageToggle currentLocale="en" currentPath={`/en/products/${slug}`} />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8">
        {/* ── Back link ──────────────────────────────────────────────────── */}
        <div className="pt-10 pb-12">
          <Link
            href="/en/"
            className="font-mono text-[9px] tracking-[0.25em] text-[#8C7B6B] uppercase hover:text-[#2C2416] transition-colors duration-200"
          >
            ← Back to Collection
          </Link>
        </div>

        {/* ── Product name ───────────────────────────────────────────────── */}
        <div className="pb-10 border-b border-[#DDD5C5]">
          <h1 className="text-[42px] font-light text-[#2C2416] leading-tight tracking-tight">
            {product.name}
          </h1>
          <p className="font-mono text-[10px] tracking-[0.25em] text-[#8C7B6B] mt-4 uppercase">
            {product.country}&nbsp;&nbsp;/&nbsp;&nbsp;{product.process}
            &nbsp;&nbsp;/&nbsp;&nbsp;{product.roast}
          </p>
        </div>

        {/* ── Product image ───────────────────────────────────────────────── */}
        <div className="mt-12 mb-16">
          <div className="w-full h-[300px] overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* ── Technical specifications ────────────────────────────────────── */}
        <div className="mb-28">
          <p className="font-mono text-[9px] tracking-[0.3em] text-[#CCCCCC] uppercase mb-8">
            Technical Specifications
          </p>
          <div className="border-t border-[#DDD5C5]">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-baseline py-5 border-b border-[#DDD5C5] gap-10"
              >
                <span className="font-mono text-[9px] tracking-[0.2em] text-[#8C7B6B] uppercase w-32 flex-shrink-0">
                  {spec.label}
                </span>
                <span className="font-mono text-[11px] tracking-[0.04em] text-[#2C2416]">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#DDD5C5] max-w-6xl mx-auto px-8 py-5">
        <p className="font-mono text-[9px] tracking-[0.2em] text-[#CCCCCC] uppercase">
          Felicity&nbsp;&nbsp;©&nbsp;{new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}
