import {
  Box,
  Button,
  Field,
  FileUpload,
  Icon,
  Input,
  VStack,
  Text,
  Heading,
  HStack,
  Center,
} from "@chakra-ui/react";
import { LuUpload } from "react-icons/lu";
import { useForm } from "react-hook-form";

export function App() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ pitchContext: string }>();

  const onSubmit = handleSubmit((data) => console.log(data));

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
              <Field.Label>Your pitch deck</Field.Label>
              <FileUpload.Root>
                <FileUpload.HiddenInput />
                <FileUpload.Trigger asChild>
                  <Button variant="outline" size="sm">
                    <LuUpload /> Upload file
                  </Button>
                </FileUpload.Trigger>
                <FileUpload.List />
              </FileUpload.Root>
            </Field.Root>

            <Button type="submit">Submit</Button>
          </VStack>
        </form>
      </Box>
    </Center>
  );
}
