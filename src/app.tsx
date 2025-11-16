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
  Card,
} from "@chakra-ui/react";
import { LuCircleStop, LuPlay, LuUpload } from "react-icons/lu";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Toaster, toaster } from "./components/ui/toaster";
import Vapi from "@vapi-ai/web";

const vapiAPIKey = import.meta.env.VITE_VAPI_API_KEY;
if (!vapiAPIKey) {
  throw new Error("VITE_VAPI_API_KEY is not set");
}

interface VapiTranscript {
  role: "user" | "assistant";
  content: string;
  transcriptType: "final" | "partial";
}

export function App() {
  const [pitchDeck, setPitchDeck] = useState<File>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVapiRunning, setIsVapiRunning] = useState<boolean>(false);
  const [vapiTranscripts, setVapiTranscripts] = useState<VapiTranscript[]>();

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

  const onSubmit = handleSubmit(async ({ pitchContext }) => {
    setVapiTranscripts([]);

    if (!pitchDeck) {
      toaster.error({
        title: "Please select a pitch deck file.",
      });
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(pitchDeck);
    reader.onload = async () => {
      try {
        const base64PitchDeck = (reader.result as string).split(",")[1];

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
        toaster.success({
          title: "Prompt generated successfully!",
          description: "Check the console for the prompt.",
        });

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
        setIsVapiRunning(true);
      } catch (error) {
        toaster.error({
          title: "An error occurred.",
          description: (error as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = (error) => {
      toaster.error({
        title: "Error reading file.",
        description: error.toString(),
      });
      setIsLoading(false);
    };
  });

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

        {isVapiRunning ? (
          <Button
            loading={isLoading}
            disabled={!isVapiRunning}
            onClick={() => {
              toaster.info({
                title: "Stopping Vapi at the end of the next message",
              });
              vapi.stop();
              setIsVapiRunning(false);
            }}
          >
            <LuCircleStop />
            Stop
          </Button>
        ) : (
          <form onSubmit={onSubmit}>
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
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={isVapiRunning}
                >
                  <LuPlay />
                  Start
                </Button>
              </HStack>
            </VStack>
          </form>
        )}

        <VapiTranscripts vapiTranscripts={vapiTranscripts} />
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
    <VStack gap={4} mt="2em">
      <Heading>Transcript</Heading>
      {filteredTranscripts.map((message) => (
        <Box
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
