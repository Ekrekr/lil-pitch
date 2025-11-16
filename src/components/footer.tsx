import { Center, HStack, Link } from "@chakra-ui/react";
import { Button } from "./ui/button";

export function Footer() {
  return (
    <Center height="10vh">
      <HStack gap={4}>
        <Link href="/privacy-policy">
          <Button variant="ghost">Privacy Policy</Button>
        </Link>
        <Link href="/tos">
          <Button variant="ghost">Terms of Service</Button>
        </Link>
      </HStack>
    </Center>
  );
}
