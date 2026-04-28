import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getContentById } from "@/data/db";

declare global {
  interface Window {
    RomPatcherWeb: any;
    RomPatcher: any;
    __isRomPatcherInitialized: boolean;
  }
}

const ErrorMessage = (
  { message, title }: { message: string; title: string },
) => {
  return (
    <div className="container mx-auto p-6 max-w-2xl mt-12">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          {message}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default function Patcher() {
  const { hackId } = useParams<{ hackId: string }>();
  const [searchParams] = useSearchParams();
  const patchPath = searchParams.get("path");
  const [itemContent, setItemContent] = useState(getContentById(hackId ?? ""));
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const isFreshMount = useRef(true);

  // Link script
  useEffect(() => {
    if (!patchPath) return;

    // Prevent React Strict Mode double-injection
    if (document.getElementById("rom-patcher-script")) {
      setIsScriptLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/rom-patcher-js/style.css";

    const script = document.createElement("script");
    script.id = "rom-patcher-script";
    script.src = "/rom-patcher-js/RomPatcher.webapp.js";
    script.async = true;

    script.onload = () => {
      setIsScriptLoaded(true);
    };

    document.head.appendChild(link);
    document.head.appendChild(script);
  }, [patchPath]);

  // Init patcher
  useEffect(() => {
    if (!patchPath) return;

    // SCENARIO 3: The user left the patcher page and came back.
    // React destroyed the old DOM, meaning the Vanilla JS engine is holding onto "dead" HTML elements.
    // We must hard-reload the page to cleanly reboot the legacy script's memory.
    if (isFreshMount.current && window.__isRomPatcherInitialized) {
      window.location.reload();
      return;
    }
    isFreshMount.current = false;

    let intervalId: number;

    const tryInitialize = () => {
      const PatcherEngine = window.RomPatcherWeb || window.RomPatcher;
      const containerExists = document.getElementById("rom-patcher-container");

      if (PatcherEngine && containerExists) {
        if (window.__isRomPatcherInitialized) {
          // SCENARIO 2: The engine is already bound to the DOM.
          // We just swap the patch seamlessly using the built-in wiki method.
          if (PatcherEngine.setEmbededPatches) {
            PatcherEngine.setEmbededPatches(patchPath);
          } else {
            console.warn(
              "setEmbededPatches method not found on PatcherEngine.",
            );
          }
        } else {
          // SCENARIO 1: First time starting up!
          const myPatcherSettings = {
            language: "en",
            requireValidation: false,
            allowDropFiles: true,
          };

          PatcherEngine.initialize(myPatcherSettings, patchPath);

          // Set a global flag so we know the engine has permanently locked onto the DOM
          window.__isRomPatcherInitialized = true;
        }

        if (intervalId) window.clearInterval(intervalId);
      }
    };

    // Begin polling
    const PatcherEngine = window.RomPatcherWeb || window.RomPatcher;
    const containerExists = document.getElementById("rom-patcher-container");

    if (PatcherEngine && containerExists) {
      tryInitialize();
    } else {
      intervalId = window.setInterval(tryInitialize, 50);
    }

    // Cleanup interval (but we cannot cleanup the Vanilla JS memory here)
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [patchPath]); // Reruns smoothly whenever the URL patchPath changes

  if (!itemContent) {
    return (
      <ErrorMessage
        title="Missing Hack Information"
        message="No hack ID was specified. Please ensure you access this tool via a valid patch link."
      />
    );
  }

  if (itemContent?.type !== "hack") {
    return (
      <ErrorMessage
        title="Content is not a hack"
        message="The selected content is not a hack and cannot be patched. Please ensure you access this tool via a valid patch link."
      />
    );
  }

  if (!patchPath) {
    return (
      <ErrorMessage
        title="Missing Patch Information"
        message="No patch file was specified. Please ensure you access this tool via a valid patch link."
      />
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl mt-12">
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Rom Patcher</CardTitle>
          <CardDescription>
            {hackId
              ? `Applying patch for ${itemContent.name}`
              : "Select your ROM to apply the patch"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div id="rom-patcher-container" className="mt-4">
            {!isScriptLoaded && (
              <p className="text-muted-foreground text-sm animate-pulse">
                Loading patcher engine...
              </p>
            )}

            {/* ROM-Patcher JS HTML Structure */}
            <div
              className="rom-patcher-row margin-bottom"
              id="rom-patcher-row-file-rom"
            >
              <div className="text-right">
                <label
                  htmlFor="rom-patcher-input-file-rom"
                  data-localize="yes"
                >
                  ROM file:
                </label>
              </div>
              <div className="rom-patcher-container-input">
                <input
                  type="file"
                  id="rom-patcher-input-file-rom"
                  className="empty"
                  disabled
                />
              </div>
            </div>
            <div
              className="margin-bottom text-selectable text-mono text-muted"
              id="rom-patcher-rom-info"
            >
              <div className="rom-patcher-row">
                <div className="text-right">CRC32:</div>
                <div className="text-truncate">
                  <span id="rom-patcher-span-crc32" />
                </div>
              </div>
              <div className="rom-patcher-row">
                <div className="text-right">MD5:</div>
                <div className="text-truncate">
                  <span id="rom-patcher-span-md5" />
                </div>
              </div>
              <div className="rom-patcher-row">
                <div className="text-right">SHA-1:</div>
                <div className="text-truncate">
                  <span id="rom-patcher-span-sha1" />
                </div>
              </div>
              <div className="rom-patcher-row" id="rom-patcher-row-info-rom">
                <div className="text-right">ROM:</div>
                <div className="text-truncate">
                  <span id="rom-patcher-span-rom-info" />
                </div>
              </div>
            </div>
            <div
              className="rom-patcher-row margin-bottom"
              id="rom-patcher-row-file-patch"
            >
              <div className="text-right">
                <label
                  htmlFor="rom-patcher-input-file-patch"
                  data-localize="yes"
                >
                  Patch file:
                </label>
              </div>
              <div className="rom-patcher-container-input">
                <select id="rom-patcher-select-patch" />
              </div>
            </div>
            <div
              className="rom-patcher-row margin-bottom"
              id="rom-patcher-row-patch-description"
            >
              <div
                className="text-right text-mono text-muted"
                data-localize="yes"
              >
                Description:
              </div>
              <div
                className="text-truncate"
                id="rom-patcher-patch-description"
              />
            </div>
            <div
              className="rom-patcher-row margin-bottom text-selectable text-mono text-muted"
              id="rom-patcher-row-patch-requirements"
            >
              <div
                className="text-right text-mono"
                id="rom-patcher-patch-requirements-type"
              >
                ROM requirements:
              </div>
              <div
                className="text-truncate"
                id="rom-patcher-patch-requirements-value"
              />
            </div>
            <div className="text-center" id="rom-patcher-row-apply">
              <div
                id="rom-patcher-row-error-message"
                className="margin-bottom"
              >
                <span id="rom-patcher-error-message" />
              </div>
              <button
                id="rom-patcher-button-apply"
                data-localize="yes"
                disabled
              >
                Apply patch
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
