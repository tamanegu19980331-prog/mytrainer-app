'use client'
import { useRouter } from 'next/navigation'

export default function PrivacyPage() {
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
            <div style={{ fontSize: 11, color: '#00c8ff', fontWeight: 700, letterSpacing: 2, marginBottom: 2 }}>LEGAL</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>プライバシーポリシー</div>
          </div>
        </div>

        <div style={{ padding: '24px', fontSize: 14, lineHeight: 1.9, color: '#aaa' }}>
          <p style={{ color: '#666', fontSize: 12, marginBottom: 24 }}>最終更新日: 2026年7月1日</p>

          <p style={{ marginBottom: 24 }}>
            MyTrainer（以下「当サービス」といいます）は、ユーザーの個人情報を適切に取り扱うことが重要な責務であると認識し、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>1. 取得する情報</h2>
          <p style={{ marginBottom: 12 }}>当サービスは、ユーザーから以下の情報を取得します。</p>
          <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
            <li style={{ marginBottom: 8 }}>メールアドレス、パスワード（暗号化して保存）</li>
            <li style={{ marginBottom: 8 }}>氏名（ニックネーム）、性別、年齢、身長、体重</li>
            <li style={{ marginBottom: 8 }}>トレーニング記録、体力テストの結果</li>
            <li style={{ marginBottom: 8 }}>体重・体脂肪率の記録</li>
            <li style={{ marginBottom: 8 }}>食事の写真および分析結果</li>
            <li style={{ marginBottom: 8 }}>生活スタイルに関するアンケート回答</li>
            <li>コミュニティ機能への投稿内容</li>
          </ul>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>2. 利用目的</h2>
          <p style={{ marginBottom: 12 }}>取得した情報は、以下の目的で利用します。</p>
          <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
            <li style={{ marginBottom: 8 }}>AIによるトレーニングメニューおよび食事提案の生成</li>
            <li style={{ marginBottom: 8 }}>ユーザーの進捗管理および記録の表示</li>
            <li style={{ marginBottom: 8 }}>コミュニティ機能の提供</li>
            <li style={{ marginBottom: 8 }}>パーソナルトレーナーによる面談サポート</li>
            <li style={{ marginBottom: 8 }}>サービスの維持、改善、新機能の開発</li>
            <li>不正利用の防止</li>
          </ul>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>3. 第三者提供</h2>
          <p style={{ marginBottom: 24 }}>
            当サービスは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。ただし、以下の外部サービスを利用してサービスを提供しており、これらのサービスにデータが送信される場合があります。
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
            <li style={{ marginBottom: 8 }}>Supabase（データベース・認証基盤）</li>
            <li style={{ marginBottom: 8 }}>Anthropic（AIによるメニュー・食事分析・チャット機能）</li>
            <li style={{ marginBottom: 8 }}>Vercel（ホスティング）</li>
            <li>Calendly（面談予約システム）</li>
          </ul>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>4. データの保管</h2>
          <p style={{ marginBottom: 24 }}>
            ユーザーの個人情報は、安全性の高いデータベース（Supabase）上で適切なアクセス制御のもとで管理されます。食事の写真は分析後も記録として保存されますが、第三者がアクセスできない形で管理されます。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>5. コミュニティ投稿の取り扱い</h2>
          <p style={{ marginBottom: 24 }}>
            コミュニティ機能への投稿は、他のユーザーに公開されます。投稿内容に個人を特定できる情報を含めないようご注意ください。不適切な投稿は通報機能により運営者が確認し、削除する場合があります。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>6. ユーザーの権利</h2>
          <p style={{ marginBottom: 24 }}>
            ユーザーは、自己の個人情報の開示、訂正、削除を求めることができます。アカウントの削除をご希望の場合は、マイページの設定よりお手続きいただくか、運営者までお問い合わせください。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>7. Cookieの利用</h2>
          <p style={{ marginBottom: 24 }}>
            当サービスは、ログイン状態の維持等のためにCookieおよび類似の技術を利用することがあります。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>8. 未成年者の利用について</h2>
          <p style={{ marginBottom: 24 }}>
            未成年者が当サービスを利用する場合は、保護者の同意を得た上でご利用ください。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>9. プライバシーポリシーの変更</h2>
          <p style={{ marginBottom: 24 }}>
            当サービスは、必要に応じて本ポリシーの内容を変更することがあります。変更後のポリシーは、当サービス上に表示した時点から効力を生じるものとします。
          </p>

          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e8e8e8', marginTop: 32, marginBottom: 12 }}>10. お問い合わせ窓口</h2>
          <p style={{ marginBottom: 24 }}>
            本ポリシーに関するお問い合わせは、アプリ内のサポート窓口またはトレーナーへの相談機能よりご連絡ください。
          </p>

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #2a2a36' }}>
            <button onClick={() => router.push('/terms')}
              style={{ color: '#00c8ff', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              利用規約はこちら →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}