import { Box, Heading } from "@chakra-ui/react";

export function Header() {
  return (
    <Box textAlign={"center"} pb="2em">
      <Heading size="4xl">Lil Pitch</Heading>
      <Heading size="xl" color="gray.500">
        An AI agent to help you practice your startup pitch
      </Heading>
    </Box>
  );
}
