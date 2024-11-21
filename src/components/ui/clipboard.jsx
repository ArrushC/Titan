import {
  Button,
  Clipboard as ChakraClipboard,
  IconButton,
  Input,
} from '@chakra-ui/react'
import * as React from 'react'
import { LuCheck, LuClipboard, LuLink } from 'react-icons/lu'

const ClipboardIcon = React.forwardRef(function ClipboardIcon(props, ref) {
  return (
    <ChakraClipboard.Indicator copied={<LuCheck />} {...props} ref={ref}>
      <LuClipboard />
    </ChakraClipboard.Indicator>
  )
})

const ClipboardCopyText = React.forwardRef(
  function ClipboardCopyText(props, ref) {
    return (
      <ChakraClipboard.Indicator copied='Copied' {...props} ref={ref}>
        Copy
      </ChakraClipboard.Indicator>
    )
  },
)

export const ClipboardLabel = React.forwardRef(
  function ClipboardLabel(props, ref) {
    return (
      <ChakraClipboard.Label
        textStyle='sm'
        fontWeight='medium'
        display='inline-block'
        mb='1'
        {...props}
        ref={ref}
      />
    )
  },
)

export const ClipboardButton = React.forwardRef(
  function ClipboardButton(props, ref) {
    return (
      <ChakraClipboard.Trigger asChild>
        <Button ref={ref} size='sm' variant='surface' {...props}>
          <ClipboardIcon />
          <ClipboardCopyText />
        </Button>
      </ChakraClipboard.Trigger>
    )
  },
)

export const ClipboardLink = React.forwardRef(
  function ClipboardLink(props, ref) {
    return (
      <ChakraClipboard.Trigger asChild>
        <Button
          unstyled
          variant='plain'
          size='xs'
          display='inline-flex'
          alignItems='center'
          gap='2'
          ref={ref}
          {...props}
        >
          <LuLink />
          <ClipboardCopyText />
        </Button>
      </ChakraClipboard.Trigger>
    )
  },
)

export const ClipboardIconButton = React.forwardRef(
  function ClipboardIconButton(props, ref) {
    return (
      <ChakraClipboard.Trigger asChild>
        <IconButton ref={ref} size='xs' variant='subtle' {...props}>
          <ClipboardIcon />
          <ClipboardCopyText srOnly />
        </IconButton>
      </ChakraClipboard.Trigger>
    )
  },
)

export const ClipboardInput = React.forwardRef(
  function ClipboardInputElement(props, ref) {
    return (
      <ChakraClipboard.Input asChild>
        <Input ref={ref} {...props} />
      </ChakraClipboard.Input>
    )
  },
)

export const ClipboardRoot = ChakraClipboard.Root
