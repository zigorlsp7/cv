import { getUiTheme } from "@/lib/architecture-variants";
import { CvProfileView } from "@/components/cv-profile-view";
import { getCvProfile } from "@/lib/cv";

export const dynamic = "force-dynamic";

export default async function Home() {
  const theme = getUiTheme();
  const profile = await getCvProfile();

  return (
    <main
      id="main-content"
      className={`min-h-[calc(100vh-4rem)] px-6 py-12 ${theme.mainBg}`}
    >
      <div className="mx-auto max-w-6xl">
        <CvProfileView initialProfile={profile} />
      </div>
    </main>
  );
}
