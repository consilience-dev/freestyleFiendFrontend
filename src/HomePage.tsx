import { BeatsGallery } from "@/components/BeatsGallery";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Beats Gallery</h1>
        <BeatsGallery />
      </div>
    </main>
  );
}
