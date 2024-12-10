import { Field as ChakraField } from "@chakra-ui/react";
import * as React from "react";

export const Field = React.forwardRef(function Field(props, ref) {
	const { label, labelFlex = undefined, children, helperText, errorText, optionalText, ...rest } = props;
	return (
		<ChakraField.Root ref={ref} {...rest}>
			{label && (
				<ChakraField.Label flex={labelFlex}>
					{label}
					<ChakraField.RequiredIndicator fallback={optionalText} ms={1} />
				</ChakraField.Label>
			)}
			{children}
			{helperText && <ChakraField.HelperText>{helperText}</ChakraField.HelperText>}
			{errorText && <ChakraField.ErrorText>{errorText}</ChakraField.ErrorText>}
		</ChakraField.Root>
	);
});
