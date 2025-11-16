import { Box, Button, Center, Heading, Link, VStack } from "@chakra-ui/react";
import { LuHouse } from "react-icons/lu";

export function PageNotFound() {
  return (
    <Box>
      <Center height="100vh" width="100vw" textAlign="center">
        <VStack>
          <Heading size="5xl" margin={0}>
            404 - Page Not Found
          </Heading>
          <Button asChild marginTop={4}>
            <Link href="/">
              <LuHouse /> Return home
            </Link>
          </Button>
        </VStack>
      </Center>
    </Box>
  );
}
