import type { Metadata } from "next";
import { Acquire } from "@/components/Acquire";
import { SetLines } from "@/components/SetLines";
import { ContactForm } from "./components/ContactForm";
import { Elsewhere } from "./components/Elsewhere";
import { getProfile } from "./profile";
import "./contact.css";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Send a message directly, or find me elsewhere. Nothing is stored — the form sends an email and forgets it.",
};

export default async function ContactPage() {
  const profile = await getProfile();

  return (
    <>
      <section className="contact-open" data-scene="Contact" aria-labelledby="contact-heading">
        <div className="hero-channel">
          <Acquire text="CONTACT" className="hero-channel-label" delay={120} />
          <span className="hero-channel-rule" aria-hidden />
          <Acquire text="REPLY WITHIN A FEW DAYS" className="hero-channel-label" delay={220} />
        </div>

        <SetLines as="h1" className="contact-heading" delay={320} id="contact-heading">
          Roles, collaborations, or a question about something here.
        </SetLines>

        <p className="contact-lede reveal-mask">
          Messages reach my inbox directly and nothing is written to the database — a
          contact form is a notification, not content.
        </p>
      </section>

      <section className="scene contact-scene" data-scene="Say hello">
        <div className="contact-layout">
          <div>
            <h2 className="sr-only">Send a message</h2>
            <ContactForm />
          </div>

          <aside className="contact-aside rm-hide">
            <Elsewhere profile={profile} />

            {profile?.email && (
              <div>
                <h2 className="elsewhere-title">Directly</h2>
                <a href={`mailto:${profile.email}`} className="contact-email">
                  {profile.email}
                </a>
                {profile.location && <p className="contact-location">{profile.location}</p>}
              </div>
            )}

            <div>
              <h2 className="elsewhere-title">What happens next</h2>
              <p className="contact-note">
                The message is emailed straight on and never stored. I read everything and
                reply to anything that needs one — usually within a few days.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
