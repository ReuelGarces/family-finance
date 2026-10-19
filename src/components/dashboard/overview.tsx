import {
  Activity, ArrowRight, ArrowUpRight, Banknote, CalendarDays, ChevronDown,
  CirclePlus, CreditCard, HeartPulse, Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import {
  CashFlowChart, CategoryChart, expenseCategories, MovementChart,
} from "@/components/dashboard/overview-charts";

const metrics = [
  { label: "Saldo em contas", value: 4286.5, note: "banco + dinheiro", change: "+ 8,2%", positive: true, icon: Wallet },
  { label: "Receitas do mês", value: 5218, note: "vs. período anterior", change: "+ 4,1%", positive: true, icon: Banknote },
  { label: "Despesas do mês", value: 3844.7, note: "vs. período anterior", change: "− 1,3%", positive: true, icon: Activity },
  { label: "Contas próximas", value: 1079, note: "3 compromissos previstos", change: "próximos 7 dias", positive: false, icon: CalendarDays },
];

function MetricCard({
  label, value, note, change, positive, icon: Icon,
}: (typeof metrics)[number]) {
  return (
    <article className="metric-card">
      <div className="metric-topline">
        <span className="metric-label">{label}</span>
        <Icon className="metric-icon" size={16} strokeWidth={1.7} />
      </div>
      <div className="metric-value">{formatCurrency(value)}</div>
      <div className="metric-foot">
        {positive ? <ArrowUpRight className="positive" size={13} /> : <span className="neutral">•</span>}
        <span className={positive ? "positive" : "neutral"}>{change}</span>
        <span>{note}</span>
      </div>
    </article>
  );
}

function QuickActions() {
  const actions = [
    { icon: CirclePlus, title: "Novo lançamento", subtitle: "Adicionar receita ou despesa" },
    { icon: CalendarDays, title: "Contas fixas", subtitle: "Ver próximos vencimentos" },
    { icon: CreditCard, title: "Dívidas", subtitle: "Acompanhar pagamentos" },
  ];

  return (
    <article className="panel quick-panel">
      <div className="quick-heading">
        <h2>Ações rápidas</h2>
        <p>Atalhos para as tarefas mais usadas.</p>
      </div>
      <div className="quick-list">
        {actions.map(({ icon: Icon, title, subtitle }) => (
          <button className="quick-action" type="button" key={title} disabled
            title="Disponível em uma próxima etapa">
            <span className="quick-action-icon"><Icon size={15} strokeWidth={1.8} /></span>
            <span className="quick-action-copy">
              <strong>{title}</strong><small>{subtitle}</small>
            </span>
            <ArrowRight size={14} />
          </button>
        ))}
      </div>
      <div className="quick-note">
        Os cadastros e lançamentos serão habilitados após a estrutura de dados financeiros.
      </div>
    </article>
  );
}

export function OverviewDashboard() {
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Visão geral</h1>
          <p>Um panorama simples para acompanhar o dinheiro da família.</p>
        </div>
        <div className="heading-actions">
          <span className="demo-pill"><span className="demo-dot" />Dados demonstrativos</span>
          <button className="period-button" type="button" disabled>
            Últimos 30 dias <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <section className="metrics-grid" aria-label="Indicadores financeiros">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </section>

      <section className="panel cashflow-panel" aria-labelledby="cashflow-title">
        <div className="panel-heading">
          <div>
            <h2 id="cashflow-title">Fluxo de caixa</h2>
            <p>Evolução demonstrativa do saldo consolidado.</p>
          </div>
          <span className="panel-meta">Saldo ao longo do período <ChevronDown size={13} /></span>
        </div>
        <CashFlowChart />
        <div className="panel-footer">
          <ArrowUpRight className="positive" size={14} />
          <span className="positive">+ 8,2%</span>
          <span>em relação ao início do período</span>
          <a href="#resumo-categorias">Ver resumo <ArrowRight size={13} /></a>
        </div>
      </section>

      <section className="lower-grid">
        <article className="panel lower-panel" aria-labelledby="movement-title">
          <div className="panel-heading">
            <div>
              <h2 id="movement-title">Receitas e despesas</h2>
              <p>Movimentação demonstrativa da semana.</p>
            </div>
            <span className="panel-meta">7 dias</span>
          </div>
          <MovementChart />
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-swatch" style={{ background: "#d7d7d9" }} />Receitas</span>
            <span className="legend-item"><span className="legend-swatch" style={{ background: "#77777c" }} />Despesas</span>
          </div>
        </article>

        <article className="panel lower-panel" id="resumo-categorias" aria-labelledby="category-title">
          <div className="panel-heading">
            <div>
              <h2 id="category-title">Despesas por categoria</h2>
              <p>Distribuição ilustrativa.</p>
            </div>
            <HeartPulse className="metric-icon" size={15} strokeWidth={1.7} />
          </div>
          <CategoryChart />
          <div className="category-list">
            {expenseCategories.map((item) => (
              <div className="category-item" key={item.category}>
                <span className="legend-swatch" style={{ background: item.color }} />
                <span>{item.category}</span>
                <strong>{item.value}%</strong>
              </div>
            ))}
          </div>
        </article>

        <QuickActions />
      </section>

      <p className="demo-disclaimer">
        Valores e gráficos são fictícios. Nenhum dado financeiro real da família está sendo usado.
      </p>
    </>
  );
}
