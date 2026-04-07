// src/pages/static/StaticPage.tsx

import { ArrowLeft } from "lucide-react"
import { useEffect } from "react"
import { useNavigate, useParams } from "react-router"

import { STATIC_PAGES } from "@/data/staticPagesData"

const StaticPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const page = slug ? STATIC_PAGES[slug] : null
  useEffect(() => {
    scrollTo(0, 0)
  }, [slug])

  // ── 404 ──
  if (!page) {
    return (
      <div className="min-h-screen bg-[#0d0f13] flex flex-col items-center justify-center gap-4">
        <span className="text-5xl">🔍</span>
        <h1 className="text-2xl font-bold text-white m-0">Page not found</h1>
        <p className="text-sm text-white/50">
          No page found for{" "}
          <code className="bg-white/8 px-2 py-0.5 rounded text-white/70">{slug}</code>
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-2 px-6 py-2.5 bg-[#00c853] text-black font-bold text-sm rounded-xl cursor-pointer"
        >
          Back to home
        </button>
      </div>
    )
  }

  return (
    <div className=" text-white">
      {/* same width + padding as EventPage */}
      <div className="container py-6 pb-20">
        {/* back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-sm font-base font-bold bg-primary  text-black hover:text-white transition-colors mb-8 cursor-pointer  border-none"
        >
          <ArrowLeft size={16} strokeWidth={3} /> Back
        </button>

        {/* page header */}
        <div className="mb-10 pb-8 border-b border-white/7">
          <h1 className="font-xxl font-extrabold tracking-tight text-white mb-2 leading-tight">
            {page.title}
          </h1>
          <p className="font-default text-white/50 m-0">{page.subtitle}</p>
        </div>

        {/* sections */}
        <div className="flex flex-col gap-9  ">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-md font-bold text-white mb-3 tracking-tight">
                {section.heading}
              </h2>
              <div className="flex flex-col gap-3">
                {section.content.map((para, i) => (
                  <p key={i} className="font-sm leading-[1.8]  text-white/75 m-0">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StaticPage
