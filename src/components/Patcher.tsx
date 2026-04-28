import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileDown,
  Loader2,
  Upload,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getContentById, getGameById } from "@/data/db";
import type { ContentItem, Game } from "@/data/types";
import { cn } from "@/lib/utils";

type PatcherSettings = {
  language: string;
  requireValidation: boolean;
  allowDropFiles: boolean;
  onvalidaterom: (romFile: unknown, isRomValid: boolean) => void;
};

type PatchInformation = {
  file: string;
  inputCrc32: string;
  outputName: string;
};

type RomPatcherEngine = {
  initialize: (settings: PatcherSettings, patch: PatchInformation) => void;
  setEmbededPatches?: (patch: PatchInformation) => void;
};

declare global {
  interface Window {
    RomPatcherWeb?: RomPatcherEngine;
    RomPatcher?: RomPatcherEngine;
    __isRomPatcherInitialized?: boolean;
  }
}

const SCRIPT_ID = "rom-patcher-script";
const SCRIPT_SRC = "/rom-patcher-js/RomPatcher.webapp.js";
const CONTAINER_ID = "rom-patcher-container";

function getPatchInformation(
  item: ContentItem | undefined,
  path: string | null,
  game: Game | undefined,
): PatchInformation | null {
  if (!item || !game || !path) return null;
  return {
    file: path,
    inputCrc32: game.CRC32,
    outputName: item.name,
  };
}

function getEngine(): RomPatcherEngine | undefined {
  return window.RomPatcherWeb || window.RomPatcher;
}

const ErrorMessage = ({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("container mx-auto mt-12 max-w-2xl p-6", className)}>
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  </div>
);

interface PatcherProps {
  hackId: string | undefined;
  patchPath: string | null;
}

export default function Patcher({ hackId, patchPath }: PatcherProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [romValidationError, setRomValidationError] = useState<string | null>(
    null,
  );
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const itemContent = useMemo(
    () => getContentById(hackId ?? ""),
    [hackId],
  );
  const game = useMemo(
    () => getGameById(itemContent?.game ?? ""),
    [itemContent?.game],
  );
  const patchInformation = useMemo(
    () => getPatchInformation(itemContent, patchPath, game),
    [itemContent, patchPath, game],
  );

  // Keep latest values accessible inside the legacy callback without re-init.
  const gameRef = useRef(game);
  const patchInfoRef = useRef(patchInformation);
  useEffect(() => {
    gameRef.current = game;
    patchInfoRef.current = patchInformation;
  }, [game, patchInformation]);

  const isFreshMount = useRef(true);

  // Inject script
  useEffect(() => {
    if (!patchPath) return;

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.head.appendChild(script);
  }, [patchPath]);

  // Initialize / reinitialize patcher
  useEffect(() => {
    if (!patchPath || !patchInformation) return;

    // Scenario 3: returning to page, engine is bound to dead DOM → hard reload.
    if (isFreshMount.current && window.__isRomPatcherInitialized) {
      window.location.reload();
      return;
    }
    isFreshMount.current = false;

    let intervalId: number | undefined;
    let cancelled = false;

    const tryInitialize = () => {
      if (cancelled) return;
      const engine = getEngine();
      const container = document.getElementById(CONTAINER_ID);
      if (!engine || !container) return;

      if (window.__isRomPatcherInitialized) {
        // Scenario 2: hot-swap the patch.
        if (engine.setEmbededPatches) {
          engine.setEmbededPatches(patchInformation);
        } else {
          console.warn("setEmbededPatches method not found on PatcherEngine.");
        }
      } else {
        // Scenario 1: first init.
        const settings: PatcherSettings = {
          language: "en",
          requireValidation: true,
          allowDropFiles: true,
          onvalidaterom: (_romFile, isRomValid) => {
            if (isRomValid) {
              setRomValidationError(null);
              return;
            }
            setRomValidationError(
              `Selected file is not a valid ROM for this patch.\nRequired CRC32-Checksum: ${
                gameRef.current?.CRC32 ?? "unknown"
              }`,
            );
          },
        };
        engine.initialize(settings, patchInformation);
        window.__isRomPatcherInitialized = true;
      }

      setIsEngineReady(true);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };

    if (getEngine() && document.getElementById(CONTAINER_ID)) {
      tryInitialize();
    } else {
      intervalId = window.setInterval(tryInitialize, 50);
    }

    return () => {
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [patchPath, patchInformation]);

  // Track selected file name for nicer UI feedback (legacy input is controlled by vanilla JS).
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      setSelectedFileName(file?.name ?? null);
    },
    [],
  );

  if (!itemContent) {
    return (
      <ErrorMessage title="Missing Hack Information">
        No hack ID was specified. Please ensure you access this tool via a valid
        patch link.
      </ErrorMessage>
    );
  }

  if (itemContent.type !== "hack") {
    return (
      <ErrorMessage title="Content is not a hack">
        The selected content is not a hack and cannot be patched. Please ensure
        you access this tool via a valid patch link.
      </ErrorMessage>
    );
  }

  if (!patchPath) {
    return (
      <ErrorMessage title="Missing Patch Information">
        No patch file was specified. Please ensure you access this tool via a
        valid patch link.
      </ErrorMessage>
    );
  }

  const isLoading = !isScriptLoaded || !isEngineReady;

  return (
    <div className="container mx-auto mt-12 max-w-3xl p-6">
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl tracking-tight">
                ROM Patcher
              </CardTitle>
              <CardDescription>
                Applying patch for{" "}
                <span className="text-foreground font-medium">
                  {itemContent.name}
                </span>
              </CardDescription>
            </div>
            <Badge
              variant={isLoading ? "secondary" : "default"}
              className={cn(
                "shrink-0 transition-colors",
                isLoading && "animate-pulse",
              )}
            >
              {isLoading
                ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Loading
                  </>
                )
                : (
                  <>
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Ready
                  </>
                )}
            </Badge>
          </div>

          {game && (
            <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{game.console}</Badge>
              <Badge variant="outline">CRC32: {game.CRC32}</Badge>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div id={CONTAINER_ID} className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold">
                Select an unmodified{" "}
                <span className="text-primary">{game?.name}</span> ROM
              </p>
              <p className="text-muted-foreground mb-3 text-xs">
                Your ROM stays in your browser — nothing is uploaded.
              </p>

              <label
                htmlFor="rom-patcher-input-file-rom"
                className={cn(
                  "group border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50 relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 transition-colors",
                  selectedFileName && "border-primary/40 bg-primary/5",
                )}
              >
                <Upload
                  className={cn(
                    "h-6 w-6 transition-colors",
                    selectedFileName
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-primary",
                  )}
                />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {selectedFileName ?? "Drop ROM here or click to browse"}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {selectedFileName
                      ? "Click to choose a different file"
                      : "Validation runs locally"}
                  </p>
                </div>
              </label>

              <input
                type="file"
                id="rom-patcher-input-file-rom"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </div>

            <div className="hidden">
              <select id="rom-patcher-select-patch" />
            </div>

            {romValidationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid ROM</AlertTitle>
                <AlertDescription className="whitespace-pre-line">
                  {romValidationError}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>

        <CardFooter className="bg-muted/20 border-t flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">
            Once validated, your patched ROM will download automatically.
          </p>
          <Button
            id="rom-patcher-button-apply"
            data-localize="yes"
            disabled
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Download {itemContent.name}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
