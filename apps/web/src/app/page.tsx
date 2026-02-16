import { getUiTheme } from "@/lib/architecture-variants";

export default function Home() {
  const theme = getUiTheme();

  return (
    <main className={`min-h-[calc(100vh-4rem)] px-6 py-12 ${theme.mainBg}`}>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className={`rounded-3xl p-8 ${theme.surface}`}>
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${theme.muted}`}>
            Landing Page
          </p>
          <h1 className={`mt-2 text-4xl font-semibold ${theme.title}`}>Curriculum Vitae</h1>
          <p className={`mt-3 max-w-3xl text-base leading-relaxed ${theme.text}`}>
            This will be your public CV presentation page. The architecture section is
            available through the top navigation to showcase the technical platform behind
            this project.
          </p>
          <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${theme.todoBadge}`}>
            TODO: Populate with real CV content
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className={`rounded-2xl p-6 ${theme.card}`}>
            <h2 className={`text-lg font-semibold ${theme.title}`}>Profile Summary</h2>
            <p className={`mt-2 text-sm leading-relaxed ${theme.text}`}>
              TODO: Add your short professional summary, impact focus, and specialization.
            </p>
          </article>
          <article className={`rounded-2xl p-6 ${theme.card}`}>
            <h2 className={`text-lg font-semibold ${theme.title}`}>Experience Highlights</h2>
            <p className={`mt-2 text-sm leading-relaxed ${theme.text}`}>
              TODO: Add key roles, achievements, and measurable outcomes.
            </p>
          </article>
          <article className={`rounded-2xl p-6 ${theme.card}`}>
            <h2 className={`text-lg font-semibold ${theme.title}`}>Skills</h2>
            <p className={`mt-2 text-sm leading-relaxed ${theme.text}`}>
              TODO: Add stack, tooling, cloud/data expertise, and language strengths.
            </p>
          </article>
          <article className={`rounded-2xl p-6 ${theme.card}`}>
            <h2 className={`text-lg font-semibold ${theme.title}`}>Projects & Education</h2>
            <p className={`mt-2 text-sm leading-relaxed ${theme.text}`}>
              TODO: Add flagship projects, certifications, and educational background.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
