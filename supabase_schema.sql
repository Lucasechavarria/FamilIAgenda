-- ==========================================
-- SCRIPT DE MIGRACIÓN Y SEGURIDAD (ROBUSTO)
-- ==========================================

-- 0) Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Añadir columnas de autenticación (Idempotente)
-- Se asegura de que las columnas auth_id existan antes de referenciarlas

DO $$
BEGIN
  -- users: auth_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_id') THEN
      ALTER TABLE public.users ADD COLUMN auth_id uuid;
    END IF;
  END IF;

  -- family_members: user_auth_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'family_members') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'family_members' AND column_name = 'user_auth_id') THEN
      ALTER TABLE public.family_members ADD COLUMN user_auth_id uuid;
    END IF;
  END IF;

  -- events: owner_auth_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'owner_auth_id') THEN
      ALTER TABLE public.events ADD COLUMN owner_auth_id uuid;
    END IF;
  END IF;

  -- event_shares: shared_with_user_auth_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_shares') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'event_shares' AND column_name = 'shared_with_user_auth_id') THEN
      ALTER TABLE public.event_shares ADD COLUMN shared_with_user_auth_id uuid;
    END IF;
  END IF;

  -- tasks: created_by_auth_id, assigned_to_auth_id, completed_by_auth_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'created_by_auth_id') THEN
      ALTER TABLE public.tasks ADD COLUMN created_by_auth_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'assigned_to_auth_id') THEN
      ALTER TABLE public.tasks ADD COLUMN assigned_to_auth_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'completed_by_auth_id') THEN
      ALTER TABLE public.tasks ADD COLUMN completed_by_auth_id uuid;
    END IF;
  END IF;

  -- messages: user_auth_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'user_auth_id') THEN
      ALTER TABLE public.messages ADD COLUMN user_auth_id uuid;
    END IF;
  END IF;

  -- notification_tokens: user_auth_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_tokens') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notification_tokens' AND column_name = 'user_auth_id') THEN
      ALTER TABLE public.notification_tokens ADD COLUMN user_auth_id uuid;
    END IF;
  END IF;
END$$;

-- 2) Crear Índices (Idempotente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_id') THEN
    CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'family_members' AND column_name = 'user_auth_id') THEN
    CREATE INDEX IF NOT EXISTS idx_family_members_user_auth_id ON public.family_members(user_auth_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'owner_auth_id') THEN
    CREATE INDEX IF NOT EXISTS idx_events_owner_auth_id ON public.events(owner_auth_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'event_shares' AND column_name = 'shared_with_user_auth_id') THEN
    CREATE INDEX IF NOT EXISTS idx_event_shares_shared_with_auth_id ON public.event_shares(shared_with_user_auth_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'created_by_auth_id') THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_created_by_auth_id ON public.tasks(created_by_auth_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'user_auth_id') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_user_auth_id ON public.messages(user_auth_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notification_tokens' AND column_name = 'user_auth_id') THEN
    CREATE INDEX IF NOT EXISTS idx_notification_tokens_user_auth_id ON public.notification_tokens(user_auth_id);
  END IF;
END$$;

-- 3) Habilitar RLS y Crear Políticas (Idempotente)

-- USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users FOR SELECT TO authenticated USING (auth_id = auth.uid());
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users FOR UPDATE TO authenticated USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());
DROP POLICY IF EXISTS users_insert_self ON public.users;
CREATE POLICY users_insert_self ON public.users FOR INSERT TO authenticated WITH CHECK (auth_id = auth.uid());

-- FAMILIES
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS families_select_for_members ON public.families;
CREATE POLICY families_select_for_members ON public.families FOR SELECT TO authenticated
USING (id IN (SELECT family_id FROM family_members WHERE user_auth_id = auth.uid()));

-- FAMILY_MEMBERS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS family_members_select_for_member ON public.family_members;
CREATE POLICY family_members_select_for_member ON public.family_members FOR SELECT TO authenticated
USING (user_auth_id = auth.uid() OR family_id IN (SELECT family_id FROM family_members WHERE user_auth_id = auth.uid()));
DROP POLICY IF EXISTS family_members_insert_self ON public.family_members;
CREATE POLICY family_members_insert_self ON public.family_members FOR INSERT TO authenticated WITH CHECK (user_auth_id = auth.uid());

-- EVENTS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS events_select ON public.events;
CREATE POLICY events_select ON public.events FOR SELECT TO authenticated
USING (
  visibility = 'public'
  OR owner_auth_id = auth.uid()
  OR family_id IN (SELECT family_id FROM family_members WHERE user_auth_id = auth.uid())
  OR id IN (SELECT event_id FROM event_shares WHERE shared_with_user_auth_id = auth.uid())
);
DROP POLICY IF EXISTS events_insert_own ON public.events;
CREATE POLICY events_insert_own ON public.events FOR INSERT TO authenticated WITH CHECK (owner_auth_id = auth.uid());
DROP POLICY IF EXISTS events_update_owner_or_shared ON public.events;
CREATE POLICY events_update_owner_or_shared ON public.events FOR UPDATE TO authenticated
USING (
  owner_auth_id = auth.uid()
  OR EXISTS (SELECT 1 FROM event_shares es WHERE es.event_id = id AND es.shared_with_user_auth_id = auth.uid() AND es.can_edit = true)
)
WITH CHECK (
  owner_auth_id = auth.uid()
  OR EXISTS (SELECT 1 FROM event_shares es WHERE es.event_id = id AND es.shared_with_user_auth_id = auth.uid() AND es.can_edit = true)
);
DROP POLICY IF EXISTS events_delete_owner ON public.events;
CREATE POLICY events_delete_owner ON public.events FOR DELETE TO authenticated USING (owner_auth_id = auth.uid());

-- EVENT_SHARES
ALTER TABLE public.event_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS event_shares_select_involved ON public.event_shares;
CREATE POLICY event_shares_select_involved ON public.event_shares FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = public.event_shares.event_id
      AND (e.owner_auth_id = auth.uid() OR e.family_id IN (SELECT family_id FROM family_members WHERE user_auth_id = auth.uid()))
  )
  OR shared_with_user_auth_id = auth.uid()
);
DROP POLICY IF EXISTS event_shares_insert_by_owner ON public.event_shares;
CREATE POLICY event_shares_insert_by_owner ON public.event_shares FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.owner_auth_id = auth.uid()));

-- TASKS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tasks_select_family ON public.tasks;
CREATE POLICY tasks_select_family ON public.tasks FOR SELECT TO authenticated
USING (family_id IN (SELECT family_id FROM family_members WHERE user_auth_id = auth.uid()));
DROP POLICY IF EXISTS tasks_insert_by_family_member ON public.tasks;
CREATE POLICY tasks_insert_by_family_member ON public.tasks FOR INSERT TO authenticated
WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_auth_id = auth.uid()) AND (created_by_auth_id IS NULL OR created_by_auth_id = auth.uid()));
DROP POLICY IF EXISTS tasks_update ON public.tasks;
CREATE POLICY tasks_update ON public.tasks FOR UPDATE TO authenticated
USING (family_id IN (SELECT family_id FROM family_members WHERE user_auth_id = auth.uid()) OR (assigned_to_auth_id = auth.uid()))
WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_auth_id = auth.uid()) OR (assigned_to_auth_id = auth.uid()));

-- MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_select_family ON public.messages;
CREATE POLICY messages_select_family ON public.messages FOR SELECT TO authenticated
USING (family_id IN (SELECT family_id FROM family_members WHERE user_auth_id = auth.uid()));
DROP POLICY IF EXISTS messages_insert_own ON public.messages;
CREATE POLICY messages_insert_own ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  family_id IN (SELECT family_id FROM family_members WHERE user_auth_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = user_id AND u.auth_id = auth.uid())
);

-- NOTIFICATION_TOKENS
ALTER TABLE public.notification_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notification_tokens_select_own ON public.notification_tokens;
CREATE POLICY notification_tokens_select_own ON public.notification_tokens FOR SELECT TO authenticated USING (user_auth_id = auth.uid());
DROP POLICY IF EXISTS notification_tokens_insert_own ON public.notification_tokens;
CREATE POLICY notification_tokens_insert_own ON public.notification_tokens FOR INSERT TO authenticated WITH CHECK (user_auth_id = auth.uid());
DROP POLICY IF EXISTS notification_tokens_delete_own ON public.notification_tokens;
CREATE POLICY notification_tokens_delete_own ON public.notification_tokens FOR DELETE TO authenticated USING (user_auth_id = auth.uid());
