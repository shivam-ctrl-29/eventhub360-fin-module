-- ============================================================
--  EventHub 360 — Module 12: Finance & Accounting
--  Database Schema Backup (structure only, no data)
--  Generated: 2026-07-13
--  Author: Shivam Mathur
--  Verified against: live production database on Neon
--  Tables (14): branch, company, credit_note, expense, fin_audit_trail,
--    invoice, invoice_line, payment, payout, pnl, tax_rule, tenant,
--    user_account, vendor_bill
-- ============================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 15.18 (Homebrew)
-- Dumped by pg_dump version 15.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: fin_set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fin_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: branch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branch (
    branch_id bigint NOT NULL,
    company_id bigint,
    name character varying(120),
    city character varying(80)
);


--
-- Name: branch_branch_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.branch_branch_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: branch_branch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.branch_branch_id_seq OWNED BY public.branch.branch_id;


--
-- Name: company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company (
    company_id bigint NOT NULL,
    tenant_id bigint,
    name character varying(150),
    gstin character varying(15),
    pan character varying(10),
    base_currency character(3) DEFAULT 'INR'::bpchar
);


--
-- Name: company_company_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_company_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: company_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_company_id_seq OWNED BY public.company.company_id;


--
-- Name: credit_note; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_note (
    credit_note_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    company_id bigint NOT NULL,
    branch_id bigint,
    invoice_id bigint NOT NULL,
    amount numeric(14,2) NOT NULL,
    reason character varying(160) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT credit_note_amount_check CHECK ((amount > (0)::numeric))
);


--
-- Name: credit_note_credit_note_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.credit_note_credit_note_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: credit_note_credit_note_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.credit_note_credit_note_id_seq OWNED BY public.credit_note.credit_note_id;


--
-- Name: expense; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense (
    expense_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    company_id bigint NOT NULL,
    branch_id bigint,
    event_id bigint,
    category character varying(40) NOT NULL,
    description text,
    amount numeric(14,2) NOT NULL,
    receipt_url text,
    status character varying(15) DEFAULT 'pending'::character varying NOT NULL,
    approved_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT expense_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT expense_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'reimbursed'::character varying])::text[])))
);


--
-- Name: expense_expense_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_expense_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_expense_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_expense_id_seq OWNED BY public.expense.expense_id;


--
-- Name: fin_audit_trail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_audit_trail (
    audit_id bigint NOT NULL,
    tenant_id bigint DEFAULT 1,
    company_id bigint DEFAULT 1,
    user_id character varying(60),
    action character varying(60) NOT NULL,
    entity character varying(60),
    entity_id character varying(60),
    description text,
    severity character varying(15) DEFAULT 'info'::character varying,
    ip_address character varying(45),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: fin_audit_trail_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_audit_trail_audit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fin_audit_trail_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_audit_trail_audit_id_seq OWNED BY public.fin_audit_trail.audit_id;


--
-- Name: invoice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice (
    invoice_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    company_id bigint NOT NULL,
    branch_id bigint,
    booking_id bigint,
    invoice_no character varying(30) NOT NULL,
    type character varying(12) DEFAULT 'Tax'::character varying NOT NULL,
    subtotal numeric(14,2) NOT NULL,
    tax_total numeric(14,2) DEFAULT 0 NOT NULL,
    total numeric(14,2) NOT NULL,
    balance numeric(14,2) NOT NULL,
    status character varying(12) DEFAULT 'Draft'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT invoice_status_check CHECK (((status)::text = ANY ((ARRAY['Draft'::character varying, 'Issued'::character varying, 'Paid'::character varying, 'Overdue'::character varying, 'Cancelled'::character varying])::text[]))),
    CONSTRAINT invoice_type_check CHECK (((type)::text = ANY ((ARRAY['Proforma'::character varying, 'Tax'::character varying])::text[])))
);


--
-- Name: invoice_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_invoice_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_invoice_id_seq OWNED BY public.invoice.invoice_id;


--
-- Name: invoice_line; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_line (
    invoice_line_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    company_id bigint NOT NULL,
    branch_id bigint,
    invoice_id bigint NOT NULL,
    description character varying(200) NOT NULL,
    qty numeric(10,2) DEFAULT 1 NOT NULL,
    rate numeric(14,2) NOT NULL,
    amount numeric(14,2) NOT NULL,
    tax_rule_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT invoice_line_qty_check CHECK ((qty > (0)::numeric)),
    CONSTRAINT invoice_line_rate_check CHECK ((rate >= (0)::numeric))
);


--
-- Name: invoice_line_invoice_line_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_line_invoice_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_line_invoice_line_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_line_invoice_line_id_seq OWNED BY public.invoice_line.invoice_line_id;


--
-- Name: payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment (
    payment_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    company_id bigint NOT NULL,
    branch_id bigint,
    invoice_id bigint NOT NULL,
    mode character varying(15) NOT NULL,
    amount numeric(14,2) NOT NULL,
    gateway_ref character varying(60),
    paid_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL,
    is_reconciled boolean DEFAULT false NOT NULL,
    matched_invoice_id bigint,
    CONSTRAINT payment_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT payment_mode_check CHECK (((mode)::text = ANY ((ARRAY['UPI'::character varying, 'Card'::character varying, 'Bank'::character varying, 'Cash'::character varying, 'Cheque'::character varying])::text[])))
);


--
-- Name: payment_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_payment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_payment_id_seq OWNED BY public.payment.payment_id;


--
-- Name: payout; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payout (
    payout_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    company_id bigint NOT NULL,
    branch_id bigint,
    vendor_invoice_id bigint,
    amount numeric(14,2) NOT NULL,
    status character varying(15) DEFAULT 'scheduled'::character varying NOT NULL,
    scheduled_date date,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT payout_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT payout_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'approved'::character varying, 'paid'::character varying])::text[])))
);


--
-- Name: payout_payout_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payout_payout_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payout_payout_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payout_payout_id_seq OWNED BY public.payout.payout_id;


--
-- Name: pnl; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pnl (
    pnl_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    company_id bigint NOT NULL,
    branch_id bigint,
    event_id bigint,
    revenue numeric(14,2) DEFAULT 0 NOT NULL,
    direct_cost numeric(14,2) DEFAULT 0 NOT NULL,
    margin numeric(14,2) GENERATED ALWAYS AS ((revenue - direct_cost)) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: pnl_pnl_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pnl_pnl_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pnl_pnl_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pnl_pnl_id_seq OWNED BY public.pnl.pnl_id;


--
-- Name: tax_rule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_rule (
    tax_rule_id bigint NOT NULL,
    company_id bigint,
    name character varying(60),
    cgst_pct numeric(5,2) DEFAULT 0,
    sgst_pct numeric(5,2) DEFAULT 0,
    igst_pct numeric(5,2) DEFAULT 0,
    hsn_sac character varying(12)
);


--
-- Name: tax_rule_tax_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tax_rule_tax_rule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tax_rule_tax_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tax_rule_tax_rule_id_seq OWNED BY public.tax_rule.tax_rule_id;


--
-- Name: tenant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant (
    tenant_id bigint NOT NULL,
    name character varying(150),
    subdomain character varying(80),
    plan character varying(20),
    status character varying(15) DEFAULT 'active'::character varying,
    is_active boolean DEFAULT true
);


--
-- Name: tenant_tenant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_tenant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_tenant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_tenant_id_seq OWNED BY public.tenant.tenant_id;


--
-- Name: user_account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_account (
    user_id bigint NOT NULL,
    tenant_id bigint,
    company_id bigint,
    email character varying(160),
    password_hash character varying(255),
    full_name character varying(120),
    phone character varying(20),
    mfa_enabled boolean DEFAULT false,
    status character varying(15) DEFAULT 'active'::character varying
);


--
-- Name: user_account_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_account_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_account_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_account_user_id_seq OWNED BY public.user_account.user_id;


--
-- Name: vendor_bill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_bill (
    vendor_bill_id bigint NOT NULL,
    tenant_id bigint DEFAULT 1 NOT NULL,
    company_id bigint DEFAULT 1 NOT NULL,
    branch_id bigint,
    bill_number character varying(40) NOT NULL,
    vendor_name character varying(160) NOT NULL,
    category character varying(40) DEFAULT 'miscellaneous'::character varying,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    gst_amount numeric(14,2) DEFAULT 0 NOT NULL,
    total_amount numeric(14,2) NOT NULL,
    bill_date date,
    due_date date,
    status character varying(15) DEFAULT 'pending'::character varying NOT NULL,
    file_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint,
    updated_by bigint,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT vendor_bill_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'paid'::character varying, 'overdue'::character varying])::text[])))
);


--
-- Name: vendor_bill_vendor_bill_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vendor_bill_vendor_bill_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vendor_bill_vendor_bill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vendor_bill_vendor_bill_id_seq OWNED BY public.vendor_bill.vendor_bill_id;


--
-- Name: branch branch_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch ALTER COLUMN branch_id SET DEFAULT nextval('public.branch_branch_id_seq'::regclass);


--
-- Name: company company_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company ALTER COLUMN company_id SET DEFAULT nextval('public.company_company_id_seq'::regclass);


--
-- Name: credit_note credit_note_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note ALTER COLUMN credit_note_id SET DEFAULT nextval('public.credit_note_credit_note_id_seq'::regclass);


--
-- Name: expense expense_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense ALTER COLUMN expense_id SET DEFAULT nextval('public.expense_expense_id_seq'::regclass);


--
-- Name: fin_audit_trail audit_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_audit_trail ALTER COLUMN audit_id SET DEFAULT nextval('public.fin_audit_trail_audit_id_seq'::regclass);


--
-- Name: invoice invoice_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice ALTER COLUMN invoice_id SET DEFAULT nextval('public.invoice_invoice_id_seq'::regclass);


--
-- Name: invoice_line invoice_line_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line ALTER COLUMN invoice_line_id SET DEFAULT nextval('public.invoice_line_invoice_line_id_seq'::regclass);


--
-- Name: payment payment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment ALTER COLUMN payment_id SET DEFAULT nextval('public.payment_payment_id_seq'::regclass);


--
-- Name: payout payout_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout ALTER COLUMN payout_id SET DEFAULT nextval('public.payout_payout_id_seq'::regclass);


--
-- Name: pnl pnl_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl ALTER COLUMN pnl_id SET DEFAULT nextval('public.pnl_pnl_id_seq'::regclass);


--
-- Name: tax_rule tax_rule_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_rule ALTER COLUMN tax_rule_id SET DEFAULT nextval('public.tax_rule_tax_rule_id_seq'::regclass);


--
-- Name: tenant tenant_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant ALTER COLUMN tenant_id SET DEFAULT nextval('public.tenant_tenant_id_seq'::regclass);


--
-- Name: user_account user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_account ALTER COLUMN user_id SET DEFAULT nextval('public.user_account_user_id_seq'::regclass);


--
-- Name: vendor_bill vendor_bill_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_bill ALTER COLUMN vendor_bill_id SET DEFAULT nextval('public.vendor_bill_vendor_bill_id_seq'::regclass);


--
-- Name: branch branch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_pkey PRIMARY KEY (branch_id);


--
-- Name: company company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (company_id);


--
-- Name: credit_note credit_note_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note
    ADD CONSTRAINT credit_note_pkey PRIMARY KEY (credit_note_id);


--
-- Name: expense expense_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_pkey PRIMARY KEY (expense_id);


--
-- Name: fin_audit_trail fin_audit_trail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_audit_trail
    ADD CONSTRAINT fin_audit_trail_pkey PRIMARY KEY (audit_id);


--
-- Name: invoice invoice_invoice_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_invoice_no_key UNIQUE (invoice_no);


--
-- Name: invoice_line invoice_line_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_pkey PRIMARY KEY (invoice_line_id);


--
-- Name: invoice invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_pkey PRIMARY KEY (invoice_id);


--
-- Name: payment payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_pkey PRIMARY KEY (payment_id);


--
-- Name: payout payout_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_pkey PRIMARY KEY (payout_id);


--
-- Name: pnl pnl_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl
    ADD CONSTRAINT pnl_event_id_key UNIQUE (event_id);


--
-- Name: pnl pnl_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl
    ADD CONSTRAINT pnl_pkey PRIMARY KEY (pnl_id);


--
-- Name: tax_rule tax_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_rule
    ADD CONSTRAINT tax_rule_pkey PRIMARY KEY (tax_rule_id);


--
-- Name: tenant tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_pkey PRIMARY KEY (tenant_id);


--
-- Name: tenant tenant_subdomain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant
    ADD CONSTRAINT tenant_subdomain_key UNIQUE (subdomain);


--
-- Name: user_account user_account_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT user_account_email_key UNIQUE (email);


--
-- Name: user_account user_account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT user_account_pkey PRIMARY KEY (user_id);


--
-- Name: vendor_bill vendor_bill_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_bill
    ADD CONSTRAINT vendor_bill_pkey PRIMARY KEY (vendor_bill_id);


--
-- Name: idx_audit_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_action ON public.fin_audit_trail USING btree (action);


--
-- Name: idx_audit_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_created ON public.fin_audit_trail USING btree (created_at DESC);


--
-- Name: idx_audit_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_severity ON public.fin_audit_trail USING btree (severity);


--
-- Name: idx_credit_note_inv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_note_inv ON public.credit_note USING btree (invoice_id);


--
-- Name: idx_expense_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_company ON public.expense USING btree (company_id);


--
-- Name: idx_expense_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_event ON public.expense USING btree (event_id) WHERE (event_id IS NOT NULL);


--
-- Name: idx_expense_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_status ON public.expense USING btree (status) WHERE is_active;


--
-- Name: idx_inv_line_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inv_line_invoice ON public.invoice_line USING btree (invoice_id);


--
-- Name: idx_invoice_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_booking ON public.invoice USING btree (booking_id) WHERE (booking_id IS NOT NULL);


--
-- Name: idx_invoice_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_company ON public.invoice USING btree (company_id);


--
-- Name: idx_invoice_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_status ON public.invoice USING btree (status) WHERE is_active;


--
-- Name: idx_payment_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_invoice ON public.payment USING btree (invoice_id);


--
-- Name: idx_payment_paid_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_paid_at ON public.payment USING btree (paid_at DESC);


--
-- Name: idx_payout_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payout_status ON public.payout USING btree (status) WHERE is_active;


--
-- Name: idx_pnl_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pnl_event ON public.pnl USING btree (event_id) WHERE (event_id IS NOT NULL);


--
-- Name: credit_note trg_credit_note_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_credit_note_updated_at BEFORE UPDATE ON public.credit_note FOR EACH ROW EXECUTE FUNCTION public.fin_set_updated_at();


--
-- Name: expense trg_expense_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_expense_updated_at BEFORE UPDATE ON public.expense FOR EACH ROW EXECUTE FUNCTION public.fin_set_updated_at();


--
-- Name: invoice_line trg_invoice_line_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_invoice_line_updated_at BEFORE UPDATE ON public.invoice_line FOR EACH ROW EXECUTE FUNCTION public.fin_set_updated_at();


--
-- Name: invoice trg_invoice_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_invoice_updated_at BEFORE UPDATE ON public.invoice FOR EACH ROW EXECUTE FUNCTION public.fin_set_updated_at();


--
-- Name: payment trg_payment_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_payment_updated_at BEFORE UPDATE ON public.payment FOR EACH ROW EXECUTE FUNCTION public.fin_set_updated_at();


--
-- Name: payout trg_payout_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_payout_updated_at BEFORE UPDATE ON public.payout FOR EACH ROW EXECUTE FUNCTION public.fin_set_updated_at();


--
-- Name: pnl trg_pnl_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pnl_updated_at BEFORE UPDATE ON public.pnl FOR EACH ROW EXECUTE FUNCTION public.fin_set_updated_at();


--
-- Name: branch branch_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: company company_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: credit_note credit_note_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note
    ADD CONSTRAINT credit_note_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: credit_note credit_note_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note
    ADD CONSTRAINT credit_note_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: credit_note credit_note_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note
    ADD CONSTRAINT credit_note_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_account(user_id);


--
-- Name: credit_note credit_note_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note
    ADD CONSTRAINT credit_note_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(invoice_id) ON DELETE RESTRICT;


--
-- Name: credit_note credit_note_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note
    ADD CONSTRAINT credit_note_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: credit_note credit_note_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note
    ADD CONSTRAINT credit_note_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_account(user_id);


--
-- Name: expense expense_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.user_account(user_id);


--
-- Name: expense expense_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: expense expense_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: expense expense_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_account(user_id);


--
-- Name: expense expense_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: expense expense_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense
    ADD CONSTRAINT expense_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_account(user_id);


--
-- Name: invoice invoice_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: invoice invoice_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: invoice invoice_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_account(user_id);


--
-- Name: invoice_line invoice_line_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: invoice_line invoice_line_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: invoice_line invoice_line_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_account(user_id);


--
-- Name: invoice_line invoice_line_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(invoice_id) ON DELETE CASCADE;


--
-- Name: invoice_line invoice_line_tax_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_tax_rule_id_fkey FOREIGN KEY (tax_rule_id) REFERENCES public.tax_rule(tax_rule_id) ON DELETE RESTRICT;


--
-- Name: invoice_line invoice_line_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: invoice_line invoice_line_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line
    ADD CONSTRAINT invoice_line_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_account(user_id);


--
-- Name: invoice invoice_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: invoice invoice_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice
    ADD CONSTRAINT invoice_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_account(user_id);


--
-- Name: payment payment_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: payment payment_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: payment payment_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_account(user_id);


--
-- Name: payment payment_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice(invoice_id) ON DELETE RESTRICT;


--
-- Name: payment payment_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: payment payment_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment
    ADD CONSTRAINT payment_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_account(user_id);


--
-- Name: payout payout_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: payout payout_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: payout payout_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_account(user_id);


--
-- Name: payout payout_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: payout payout_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout
    ADD CONSTRAINT payout_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_account(user_id);


--
-- Name: pnl pnl_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl
    ADD CONSTRAINT pnl_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id) ON DELETE RESTRICT;


--
-- Name: pnl pnl_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl
    ADD CONSTRAINT pnl_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: pnl pnl_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl
    ADD CONSTRAINT pnl_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_account(user_id);


--
-- Name: pnl pnl_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl
    ADD CONSTRAINT pnl_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id) ON DELETE RESTRICT;


--
-- Name: pnl pnl_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pnl
    ADD CONSTRAINT pnl_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_account(user_id);


--
-- Name: tax_rule tax_rule_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_rule
    ADD CONSTRAINT tax_rule_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE RESTRICT;


--
-- Name: user_account user_account_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT user_account_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(company_id);


--
-- Name: user_account user_account_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT user_account_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenant(tenant_id);


--
-- PostgreSQL database dump complete
--


