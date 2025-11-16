import {
  Box,
  Button,
  Field,
  FileUpload,
  Input,
  VStack,
  Heading,
  Center,
  Text,
  HStack,
  Spinner,
} from "@chakra-ui/react";
import { LuCircleStop, LuPlay, LuTimerReset, LuUpload } from "react-icons/lu";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Toaster, toaster } from "./components/ui/toaster";
import Vapi from "@vapi-ai/web";
import ReactMarkdown from "react-markdown";

const vapiAPIKey = import.meta.env.VITE_VAPI_API_KEY;
if (!vapiAPIKey) {
  throw new Error("VITE_VAPI_API_KEY is not set");
}

export interface VapiTranscript {
  role: "user" | "assistant";
  content: string;
  transcriptType: "final" | "partial";
}

export function App() {
  const [appState, setAppState] = useState<
    "detailsInput" | "interviewing" | "interviewFinished"
  >("detailsInput");

  const [pitchDeck, setPitchDeck] = useState<File>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [vapiTranscripts, setVapiTranscripts] = useState<VapiTranscript[]>([]);
  const [interviewFeedback, setInterviewFeedback] = useState<string>("");
  // const [vapiCall, setVapiCall] = useState<Vapi | null>(null);

  // Keeping track of this state here is a hack.
  const [pitchContext, setPitchContext] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ pitchContext: string }>();

  const vapi = new Vapi(vapiAPIKey);
  vapi.on("error", (e) => {
    toaster.error({
      title: "Vapi Error",
      description: e.message,
    });
  });
  vapi.on("message", (message) => {
    if (message.type === "transcript") {
      if (
        (message.role === "user" || message.role === "assistant") &&
        (message.transcriptType === "final" ||
          message.transcriptType === "partial")
      ) {
        setVapiTranscripts((currentTranscripts) => [
          ...currentTranscripts,
          {
            role: message.role,
            content: message.transcript,
            transcriptType: message.transcriptType,
          },
        ]);
      }
    }
  });

  const startInterview = handleSubmit(async ({ pitchContext }) => {
    setPitchContext(pitchContext);
    setVapiTranscripts([]);

    if (!pitchDeck) {
      toaster.error({
        title: "Please select a pitch deck file.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const base64PitchDeck = await getBase64FromFile(pitchDeck);

      const response = await fetch("/api/create_vc_prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pitchContext,
          pitchDeck: base64PitchDeck,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create VC prompt, error code: ${response.statusText}`
        );
      }

      const data = await response.json();

      vapi.start("8ad8cd0a-e10d-4043-8b55-2b8ce92a0fd9", {
        model: {
          provider: "openai",
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: data.prompt,
            },
          ],
        },
      });
      setAppState("interviewing");
    } catch (error) {
      toaster.error({
        title: "An error occurred.",
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  });

  const finishInterview = async () => {
    setIsLoading(true);
    toaster.info({
      title: "Stopping Vapi at the end of the next message",
    });
    await vapi.stop();
    setAppState("interviewFinished");

    try {
      const base64PitchDeck = await getBase64FromFile(pitchDeck);

      const response = await fetch("/api/analyse_pitch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pitchContext,
          pitchDeck: base64PitchDeck,
          transcript: JSON.stringify(vapiTranscripts),
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to analyse pitch, error code: ${response.statusText}`
        );
      }

      const data = await response.json();
      setInterviewFeedback(data.pitchAnalysis);
    } catch (error) {
      toaster.error({
        title: "An error occurred.",
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center>
      <Toaster />

      <Box maxWidth="48em" padding="2em">
        <Box textAlign={"center"} pb="2em">
          <Heading size="4xl">Lil Pitch</Heading>
          <Heading size="xl" color="gray.500">
            An AI agent to help you practice your startup pitch
          </Heading>
        </Box>

        {appState === "detailsInput" && (
          <form onSubmit={startInterview}>
            <VStack gap={8}>
              <Field.Root invalid={!!errors.pitchContext}>
                <Field.Label>Pitch Context</Field.Label>
                <Input {...register("pitchContext")} />
                <Field.ErrorText>
                  {errors.pitchContext?.message}
                </Field.ErrorText>
                <Field.HelperText>
                  Who you are, what your role is, who is interviewing you, and
                  any additional context that you'd like to add.
                </Field.HelperText>
              </Field.Root>

              <Field.Root invalid={!!errors.pitchContext}>
                <Field.Label>Your pitch deck (PDFs only)</Field.Label>
                <FileUpload.Root
                  onFileAccept={({ files }: { files: File[] }) => {
                    setPitchDeck(files[0]);
                  }}
                >
                  <FileUpload.HiddenInput />
                  <FileUpload.Trigger asChild>
                    <Button variant="outline" size="sm">
                      <LuUpload /> Upload file
                    </Button>
                  </FileUpload.Trigger>
                  <FileUpload.List />
                </FileUpload.Root>
              </Field.Root>

              <HStack>
                <Button type="submit" loading={isLoading}>
                  <LuPlay />
                  Start
                </Button>
              </HStack>
            </VStack>
          </form>
        )}

        {appState === "interviewing" && (
          <Center width="100%">
            <Button loading={isLoading} onClick={finishInterview}>
              <LuCircleStop />
              Stop
            </Button>
          </Center>
        )}

        {appState === "interviewFinished" && (
          <>
            <Center width="100%">
              <Button
                loading={isLoading}
                onClick={async () => {
                  setVapiTranscripts([]);
                  setInterviewFeedback("");
                  setAppState("detailsInput");
                }}
              >
                <LuTimerReset />
                Reset
              </Button>
            </Center>
            <Box marginBottom="2em" marginTop="2em">
              <Heading size="lg">Interview Feedback</Heading>
              {interviewFeedback ? (
                <ReactMarkdown>{interviewFeedback}</ReactMarkdown>
              ) : (
                <Center width="100%">
                  <Spinner />
                </Center>
              )}
            </Box>
          </>
        )}

        {(appState === "interviewing" || appState === "interviewFinished") && (
          <VapiTranscripts vapiTranscripts={vapiTranscripts} />
        )}
      </Box>
    </Center>
  );
}

function VapiTranscripts({
  vapiTranscripts,
}: {
  vapiTranscripts: VapiTranscript[];
}) {
  if (!vapiTranscripts?.length) {
    return <></>;
  }

  // Join together all transcripts as required.
  const filteredTranscripts: VapiTranscript[] = [];
  vapiTranscripts
    .filter((vapiTranscript) => vapiTranscript.transcriptType === "final")
    .forEach((vapiTranscript) => {
      const lastTranscript = filteredTranscripts.slice(-1)?.[0];
      if (lastTranscript?.role === vapiTranscript.role) {
        // This final segment is part of the same speech bubble.
        lastTranscript.content =
          lastTranscript.content + " " + vapiTranscript.content;
      } else {
        // This final segment is part of a new speech bubble.
        filteredTranscripts.push({ ...vapiTranscript });
      }
    });

  const maybePartialTranscript = vapiTranscripts.slice(-1)?.[0];
  if (maybePartialTranscript?.transcriptType === "partial") {
    if (
      filteredTranscripts.slice(-1)?.[0]?.role === maybePartialTranscript.role
    ) {
      // This partial segment is part of the same speech bubble.
      filteredTranscripts.slice(-1)[0].content +=
        " " + maybePartialTranscript.content;
    } else {
      // This partial segment is part of a new speech bubble.
      filteredTranscripts.push({ ...maybePartialTranscript });
    }
  }

  return (
    <VStack gap={4} mt="2em" width="100%">
      <Heading size="lg">Transcript</Heading>
      {filteredTranscripts.map((message, index) => (
        <Box
          key={`vapi-transcript-${index}`}
          backgroundColor="gray.100"
          padding="0.5em"
          borderRadius="8px"
          width="90%"
          marginLeft={message.role === "user" ? "10%" : "0"}
          marginRight={message.role === "user" ? "0%" : "10%"}
        >
          <Text color="gray.500">{message.role}</Text>
          <Text>{message.content}</Text>
        </Box>
      ))}
    </VStack>
  );
}

function getBase64FromFile(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        // Get the result, which is a data URL (e.g., "data:image/png;base64,iVBORw...")
        const dataUrl = reader.result as string;
        // Split off the prefix to get only the Base64 content.
        const base64 = dataUrl.split(",")[1];

        if (base64) {
          resolve(base64);
        } else {
          // This happens if the split fails or the file is empty.
          reject(new Error("Failed to parse Base64 data from file."));
        }
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}
