"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Video } from "lucide-react";

interface Props {
  roomName: string;
  displayName: string;
  backHref: string;
  title: string;
  subtitle: string;
}

type JitsiApi = { dispose: () => void };
type JitsiCtor = new (domain: string, options: Record<string, unknown>) => JitsiApi;

const JITSI_DOMAIN = "meet.jit.si";

/** Embeds a Jitsi Meet room for a confirmed video intro meeting. */
export default function VideoRoom({ roomName, displayName, backHref, title, subtitle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let api: JitsiApi | null = null;
    const mount = () => {
      const Ctor = (window as unknown as { JitsiMeetExternalAPI?: JitsiCtor }).JitsiMeetExternalAPI;
      if (!Ctor || !containerRef.current) {
        setFailed(true);
        return;
      }
      api = new Ctor(JITSI_DOMAIN, {
        roomName,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        lang: "he",
        userInfo: { displayName },
        configOverwrite: {
          prejoinPageEnabled: true,
          disableDeepLinking: true,
          defaultLanguage: "he",
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          MOBILE_APP_PROMO: false,
        },
      });
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="https://${JITSI_DOMAIN}/external_api.js"]`);
    if (existing) {
      mount();
    } else {
      const script = document.createElement("script");
      script.src = `https://${JITSI_DOMAIN}/external_api.js`;
      script.async = true;
      script.onload = mount;
      script.onerror = () => setFailed(true);
      document.body.appendChild(script);
    }
    return () => {
      api?.dispose();
    };
  }, [roomName, displayName]);

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      <header className="flex items-center justify-between gap-3 px-4 py-3 bg-neutral-900 border-b border-neutral-800">
        <div className="min-w-0">
          <h1 className="font-bold text-base truncate flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            {title}
          </h1>
          <p className="text-xs text-neutral-400 truncate">{subtitle}</p>
        </div>
        <Link
          href={backHref}
          className="flex items-center gap-1 text-sm font-semibold text-neutral-200 hover:text-white flex-shrink-0"
        >
          חזרה
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </header>
      <div ref={containerRef} className="flex-1 min-h-0" />
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-neutral-200">
            לא ניתן לטעון את חדר הוידאו. בדקו את החיבור לאינטרנט ונסו לרענן.
          </p>
        </div>
      )}
    </div>
  );
}
