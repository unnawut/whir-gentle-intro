import { Layout } from './components/Layout'
import { S1_WhatProblem } from './sections/S1_WhatProblem'
import { S2_FromCodeToPolynomials } from './sections/S2_FromCodeToPolynomials'
import { S3_ReedSolomon } from './sections/S3_ReedSolomon'
import { S4_ConstrainedRS } from './sections/S4_ConstrainedRS'
import { S5_Sumcheck } from './sections/S5_Sumcheck'
import { S6_Folding } from './sections/S6_Folding'
import { S7_WhirIteration } from './sections/S7_WhirIteration'
import { S8_RecursiveStructure } from './sections/S8_RecursiveStructure'
import { S9_Performance } from './sections/S9_Performance'

export default function App() {
  return (
    <Layout>
      <S1_WhatProblem />
      <S2_FromCodeToPolynomials />
      <S3_ReedSolomon />
      <S4_ConstrainedRS />
      <S5_Sumcheck />
      <S6_Folding />
      <S7_WhirIteration />
      <S8_RecursiveStructure />
      <S9_Performance />
    </Layout>
  )
}
