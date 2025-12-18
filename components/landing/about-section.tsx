"use client";

import { useTranslations } from "next-intl";
import { Code2, Layers, Globe, Zap } from "lucide-react";

const features = [
  {
    icon: Code2,
    key: "showcase",
  },
  {
    icon: Layers,
    key: "organize",
  },
  {
    icon: Globe,
    key: "share",
  },
  {
    icon: Zap,
    key: "analytics",
  },
];

export function AboutSection() {
  const t = useTranslations("Landing");

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main description */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            {t("about.title")}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
            {t("about.description")}
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {t(`about.features.${key}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(`about.features.${key}.description`)}
              </p>
            </div>
          ))}
        </div>

        {/* CTA section */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 border border-primary/20">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 border-2 border-background flex items-center justify-center"
                >
                  <span className="text-xs font-medium text-primary-foreground">
                    {String.fromCharCode(65 + i)}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-sm text-foreground">
              {t("about.cta")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

