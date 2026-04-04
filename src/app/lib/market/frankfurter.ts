export async function getExchangeRate(from = 'USD', to = 'JPY') {
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);

    const data = await res.json();
    return data.rates[to] as number;
  } catch (error) {
    console.error('為替取得エラー:', error);
    return null;
  }
}
