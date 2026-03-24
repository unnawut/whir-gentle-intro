import { Layout } from './components/Layout'
import { S1_WhatProblem } from './sections/S1_WhatProblem'
import { S2_ReedSolomon } from './sections/S2_ReedSolomon'
import { S3_ConstrainedRS } from './sections/S3_ConstrainedRS'
import { S4_Sumcheck } from './sections/S4_Sumcheck'
import { S5_Folding } from './sections/S5_Folding'
import { S6_WhirIteration } from './sections/S6_WhirIteration'
import { S7_RecursiveStructure } from './sections/S7_RecursiveStructure'
import { S8_Performance } from './sections/S8_Performance'

export default function App() {
  return (
    <Layout>
      <S1_WhatProblem />
      <S2_ReedSolomon />
      <S3_ConstrainedRS />
      <S4_Sumcheck />
      <S5_Folding />
      <S6_WhirIteration />
      <S7_RecursiveStructure />
      <S8_Performance />
    </Layout>
  )
}
