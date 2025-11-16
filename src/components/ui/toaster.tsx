import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react";
import { HelpLink } from "@/routes";

export const toaster = createToaster({
  placement: "bottom",
  pauseOnPageIdle: true,
  max: 1,
});

/* Use this when the app is doing something unintended. */
export function throwInternalError(context: string, fullError?: Error) {
  const description = fullError ? `${context}: ${fullError?.message}` : context;
  toaster.create({
    // TODO(ekrekr): add a report link.
    title: (
      <>
        Unexpected error, please <HelpLink />.
      </>
    ),
    description,
    type: "error",
    duration: 5000,
  });
  console.error(description);
  // TODO(ekrekr): track internal errors in analytics.
  // if (isProd()) {
  //   ReactGA.event({
  //     category: "event",
  //     action: "error",
  //     label: description,
  //   });

  //   firebaseAnalytics.trackCustomEvent(ANALYTICS_EVENTS.APPLICATION_ERROR, {
  //     error_context: context,
  //     error_message: fullError?.message || context,
  //   });
  // }
}

/**
 * Use this to tell the user that what they're doing doesn't make sense.
 * It's better to restrict functionality rather than just throw an error,
 * but this has to be done in some cases.
 */
export function throwUserError(message: string, title = "Usage error") {
  toaster.create({
    title,
    description: message,
    type: "warning",
    duration: 5000,
  });
}

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <Toast.Root width={{ md: "lg" }}>
            {toast.type === "loading" ? (
              <Spinner size="sm" color="blue.solid" />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && (
                <Toast.Description>{toast.description}</Toast.Description>
              )}
            </Stack>
            {toast.action && (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            )}
            {toast.meta?.closable && <Toast.CloseTrigger />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
};
