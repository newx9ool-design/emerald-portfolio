'use client';
import { useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { Card, CardTitle } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setMessage(error.message); }
      else { setMessage('確認メールを送信しました。メールを確認してください。'); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setMessage(error.message); }
      else { window.location.href = '/'; }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card>
        <CardTitle>{isSignUp ? 'アカウント作成' : 'ログイン'}</CardTitle>
        {message && <p className="text-sm text-brand-600 mb-4">{message}</p>}
        <form onSubmit={handleSubmit}>
          <Input label="メールアドレス" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@email.com" />
          <Input label="パスワード" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="6文字以上" />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '処理中...' : isSignUp ? '登録する' : 'ログイン'}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          {isSignUp ? '既にアカウントをお持ちの方は' : 'アカウントをお持ちでない方は'}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-brand-500 hover:underline ml-1">
            {isSignUp ? 'ログイン' : '新規登録'}
          </button>
        </p>
      </Card>
    </div>
  );
}
