import {
  Box,
  Button,
  Field,
  FileUpload,
  Input,
  VStack,
  Heading,
  Center,
} from "@chakra-ui/react";
import { LuUpload } from "react-icons/lu";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toaster } from "./components/ui/toaster";

export function App() {
  const [pitchDeck, setPitchDeck] = useState<File>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ pitchContext: string }>();

  const onSubmit = handleSubmit(async ({ pitchContext }) => {
    console.log("Form submitted");

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
          throw new Error("Failed to create VC prompt.");
        }

        const data = await response.json();
        console.log("Generated Prompt:", data.prompt);
        toaster.success({
          title: "Prompt generated successfully!",
          description: "Check the console for the prompt.",
        });
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
      <Box maxWidth="32em" padding="2em">
        <Box textAlign={"center"} pb="2em">
          <Heading size="4xl">Lil Pitch</Heading>
          <Heading size="xl">
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

            <Button type="submit" loading={isLoading}>
              Submit
            </Button>
          </VStack>
        </form>
      </Box>
    </Center>
  );
}
