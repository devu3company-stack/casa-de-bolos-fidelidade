-- Tabela de Perfis de Fidelidade
CREATE TABLE IF NOT EXISTS loyalty_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    phone TEXT,
    birthday DATE,
    stamps INTEGER DEFAULT 0,
    marketing_consent BOOLEAN DEFAULT TRUE,
    last_purchase TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Histórico de Pontos/Carimbos
CREATE TABLE IF NOT EXISTS stamp_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES loyalty_profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'ADD' para carimbo, 'REDEEM' para resgate
    amount INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE loyalty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamp_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Públicas para este MVP - CUIDADO EM PRODUÇÃO)
-- Em um cenário real, você configuraria autenticação para os funcionários
CREATE POLICY "Permitir acesso total para todos" ON loyalty_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total para todos" ON stamp_transactions FOR ALL USING (true) WITH CHECK (true);
