'use client'
import { useRouter } from 'next/navigation'

export default function TermsPage() {
  const router = useRouter()

  return (
    <div style={{ background: '#16161a', minHeight: '100vh', color: '#e8e8e8' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 80px' }}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e1e26', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()}
            style={{ background: 'none', border: 'none', color: '#666', fontSize: 24, cursor: 'pointer', padding: 0 }}>
            ←
          </button>
          <div>
            <div style={{ fontSize: 11, color: '#39ff14', fontWeight: 700, letterSpacing: 2, marginBottom: 2 }}>LEGAL</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>利用規約</div>
          </div>
        </div>

        <div style={{ padding: '24px', fontSize: 14, lineHeight: 1.9, color: '#aaa' }}>
          <p style={{ color: '#666', fontSize: 12, marginBottom: 24 }}>最終更新日: 2026年7月1日</p>

          <p style={{ marginBottom: 24 }}>
            本利用規約（以下「本規約」といいます）は、MyTrainer（以下「当サービス」といいます）の利用条件を定めるものです。利用者の皆様（以下「ユーザー」といいます）には、本規約に従って当サービスをご利用いただきます。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>第1条（適用）</h2>
          <p style={{ marginBottom: 24 }}>
            本規約は、ユーザーと運営者との間の当サービスの利用に関わる一切の関係に適用されるものとします。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>第2条（利用登録）</h2>
          <p style={{ marginBottom: 24 }}>
            登録希望者が運営者の定める方法によって利用登録を申請し、運営者がこれを承認することによって、利用登録が完了するものとします。運営者は、利用登録の申請に際して虚偽の事項を届け出た場合など、登録を相当でないと判断した場合には、利用登録の申請を承認しないことがあります。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>第3条（健康に関する注意事項）</h2>
          <p style={{ marginBottom: 24 }}>
            当サービスが提供するトレーニングメニューおよび食事提案は、AIおよびトレーナーの知見に基づく一般的な情報であり、医学的な診断や治療を目的としたものではありません。持病がある方、妊娠中の方、体調に不安のある方は、必ず医師にご相談の上ご利用ください。トレーニング中の負傷、体調不良その他の損害について、運営者は一切の責任を負いかねます。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>第4条（禁止事項）</h2>
          <p style={{ marginBottom: 12 }}>ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。</p>
          <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
            <li style={{ marginBottom: 8 }}>法令または公序良俗に違反する行為</li>
            <li style={{ marginBottom: 8 }}>犯罪行為に関連する行為</li>
            <li style={{ marginBottom: 8 }}>他のユーザーまたは第三者を誹謗中傷する行為</li>
            <li style={{ marginBottom: 8 }}>当サービスの運営を妨害するおそれのある行為</li>
            <li style={{ marginBottom: 8 }}>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
            <li style={{ marginBottom: 8 }}>不正アクセスをし、またはこれを試みる行為</li>
            <li>その他、運営者が不適切と判断する行為</li>
          </ul>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>第5条（コミュニティ機能について）</h2>
          <p style={{ marginBottom: 24 }}>
            当サービスのコミュニティ機能において、運営者が不適切と判断した投稿は、事前の通知なく削除する場合があります。また、悪質な利用が確認された場合、アカウントの利用を停止することがあります。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>第6条（サービス内容の変更等）</h2>
          <p style={{ marginBottom: 24 }}>
            運営者は、ユーザーへの事前の告知なく、当サービスの内容を変更、追加または廃止することがあり、ユーザーはこれを承諾するものとします。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>第7条（利用制限および登録抹消）</h2>
          <p style={{ marginBottom: 24 }}>
            運営者は、ユーザーが本規約のいずれかの条項に違反した場合には、事前の通知なく、ユーザーに対して当サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>第8条（免責事項）</h2>
          <p style={{ marginBottom: 24 }}>
            運営者は、当サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡、紛争等について一切責任を負いません。また、当サービスの内容の正確性、完全性、有用性等についていかなる保証も行いません。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>第9条（規約の変更）</h2>
          <p style={{ marginBottom: 24 }}>
            運営者は、必要と判断した場合には、ユーザーに通知することなく本規約を変更することができるものとします。変更後の規約は当サービス上に表示した時点より効力を生じるものとします。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>第10条（準拠法・裁判管轄）</h2>
          <p style={{ marginBottom: 24 }}>
            本規約の解釈にあたっては、日本法を準拠法とします。当サービスに関して紛争が生じた場合には、運営者の所在地を管轄する裁判所を専属的合意管轄とします。
          </p>

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #2a2a36' }}>
            <button onClick={() => router.push('/privacy')}
              style={{ color: '#39ff14', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              プライバシーポリシーはこちら →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}