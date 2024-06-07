import React from 'react'
import styled, { css } from 'styled-components'

import { HashLink } from 'react-router-hash-link'

import { TelegramIcon } from '../../icons/TelegramIcon'
import { InnerContainer } from '../../pureStyledComponents/InnerContainer'

const Wrapper = styled.footer`
  display: flex;
  height: auto;
  justify-content: center;
  margin-top: auto;
  overflow: visible;
  padding: 65px 0 25px 0;
  width: 100%;
`

const Inner = styled(InnerContainer)`
  column-gap: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  list-style: none;
  margin: 0;
  padding-bottom: 0;
  padding-left: ${(props) => props.theme.layout.horizontalPadding};
  padding-right: ${(props) => props.theme.layout.horizontalPadding};
  padding-top: 0;
  row-gap: 10px;

  @media (min-width: ${({ theme }) => theme.themeBreakPoints.md}) {
    align-items: center;
    column-gap: unset;
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    flex-shrink: 0;
    grid-template-columns: unset;
    justify-content: center;
    row-gap: unset;
  }
`

const Item = styled.span`
  color: ${({ theme }) => theme.text1};
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  margin: 0;
  opacity: 0.8;

  &:hover {
    opacity: 1;
  }

  @media (min-width: ${({ theme }) => theme.themeBreakPoints.md}) {
    margin-right: 30px;

    &:last-child {
      margin-right: 0;
    }
  }
`

const LinkCSS = css`
  color: ${({ theme }) => theme.text1};
  text-decoration: none;
  transition: color 0.05s linear;

  &:hover {
    color: ${({ theme }) => theme.primary2};
  }
`

const ExternalLink = styled.a`
  ${LinkCSS}
`

const Link = styled(HashLink)`
  ${LinkCSS}
`

export const Footer: React.FC = (props) => {
  const { ...restProps } = props
  const date = new Date()
  const year = date.getFullYear()

  return (
    <Wrapper {...restProps}>
      <Inner>
        <Item>{`©${year} Altar of RAI`}</Item>
      </Inner>
    </Wrapper>
  )
}
