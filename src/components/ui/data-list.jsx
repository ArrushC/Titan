import { DataList as ChakraDataList } from '@chakra-ui/react'
import { InfoTip } from './toggle-tip'
import * as React from 'react'

export const DataListRoot = ChakraDataList.Root

export const DataListItem = React.forwardRef(function DataListItem(props, ref) {
  const { label, info, value, children, grow, ...rest } = props
  return (
    <ChakraDataList.Item ref={ref} {...rest}>
      <ChakraDataList.ItemLabel flex={grow ? '1' : undefined}>
        {label}
        {info && <InfoTip>{info}</InfoTip>}
      </ChakraDataList.ItemLabel>
      <ChakraDataList.ItemValue flex={grow ? '1' : undefined}>
        {value}
      </ChakraDataList.ItemValue>
      {children}
    </ChakraDataList.Item>
  )
})
