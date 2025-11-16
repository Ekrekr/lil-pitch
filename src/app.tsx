import {
  Box,
  Button,
  Field,
  FileUpload,
  Input,
  VStack,
  Heading,
  Center,
  HStack,
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

export function App() {
  const [pitchDeck, setPitchDeck] = useState<File>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVapiRunning, setIsVapiRunning] = useState<boolean>(false);

  const vapi = new Vapi(vapiAPIKey);
  vapi.on("error", (e) => {
    toaster.error({
      title: "Vapi Error",
      description: e.message,
    });
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ pitchContext: string }>();

  const onSubmit = handleSubmit(async ({ pitchContext }) => {
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
        setIsVapiRunning(false);
      }
    };
    reader.onerror = (error) => {
      toaster.error({
        title: "Error reading file.",
        description: error.toString(),
      });
      setIsLoading(false);
      setIsVapiRunning(false);
    };
  });

  return (
    <Center>
      <Toaster />

      <Box maxWidth="48em" padding="2em">
        <Box textAlign={"center"} pb="2em">
          <Heading size="4xl">Lil Pitch</Heading>
          <Heading size="xl" color="gray.800">
            An AI agent to help you practice your startup pitch
          </Heading>
        </Box>

        <form onSubmit={onSubmit}>
          <VStack gap={8}>
            <Field.Root invalid={!!errors.pitchContext}>
              <Field.Label>Pitch Context</Field.Label>
              <Input {...register("pitchContext")} />
              <Field.ErrorText>{errors.pitchContext?.message}</Field.ErrorText>
              <Field.HelperText>
                Who you are, what your role is, who is interviewing you, and any
                additional context that you'd like to add.
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
            </HStack>
          </VStack>
        </form>
      </Box>
    </Center>
  );
}
