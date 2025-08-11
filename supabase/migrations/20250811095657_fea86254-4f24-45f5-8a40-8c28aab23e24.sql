-- Fix search path security warning for the log function
CREATE OR REPLACE FUNCTION public.log_expense_transaction_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_name_val TEXT;
  category_name_val TEXT;
  old_category_name_val TEXT;
  old_data_json JSONB;
  new_data_json JSONB;
  changed_fields_array TEXT[] := '{}';
BEGIN
  -- Handle different trigger operations
  IF TG_OP = 'DELETE' THEN
    -- Get user and category names for the deleted record
    SELECT ep.full_name INTO user_name_val
    FROM public.expense_profile ep
    WHERE ep.user_id = OLD.user_id;
    
    SELECT ec.name INTO category_name_val
    FROM public.expense_categories ec
    WHERE ec.id = OLD.category_id;
    
    -- Build old data JSON with human-readable names
    old_data_json := jsonb_build_object(
      'id', OLD.id,
      'user_id', OLD.user_id,
      'user_name', COALESCE(user_name_val, 'Unknown User'),
      'category_id', OLD.category_id,
      'category_name', COALESCE(category_name_val, 'Unknown Category'),
      'amount', OLD.amount,
      'description', OLD.description,
      'transaction_date', OLD.transaction_date,
      'tags', OLD.tags,
      'receipt_url', OLD.receipt_url,
      'created_at', OLD.created_at,
      'updated_at', OLD.updated_at
    );
    
    -- Insert log entry (with error handling to not block main operation)
    BEGIN
      INSERT INTO public.expense_transaction_logs (
        transaction_id, action, user_name, category_name, 
        old_data, performed_by
      ) VALUES (
        OLD.id, 'DELETE', user_name_val, category_name_val, 
        old_data_json, auth.uid()
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the main operation
      RAISE WARNING 'Failed to insert expense transaction log: %', SQLERRM;
    END;
    
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Get user and category names for the updated record
    SELECT ep.full_name INTO user_name_val
    FROM public.expense_profile ep
    WHERE ep.user_id = NEW.user_id;
    
    SELECT ec.name INTO category_name_val
    FROM public.expense_categories ec
    WHERE ec.id = NEW.category_id;
    
    SELECT ec.name INTO old_category_name_val
    FROM public.expense_categories ec
    WHERE ec.id = OLD.category_id;
    
    -- Build old and new data JSON with human-readable names
    old_data_json := jsonb_build_object(
      'id', OLD.id,
      'user_id', OLD.user_id,
      'user_name', COALESCE(user_name_val, 'Unknown User'),
      'category_id', OLD.category_id,
      'category_name', COALESCE(old_category_name_val, 'Unknown Category'),
      'amount', OLD.amount,
      'description', OLD.description,
      'transaction_date', OLD.transaction_date,
      'tags', OLD.tags,
      'receipt_url', OLD.receipt_url,
      'created_at', OLD.created_at,
      'updated_at', OLD.updated_at
    );
    
    new_data_json := jsonb_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'user_name', COALESCE(user_name_val, 'Unknown User'),
      'category_id', NEW.category_id,
      'category_name', COALESCE(category_name_val, 'Unknown Category'),
      'amount', NEW.amount,
      'description', NEW.description,
      'transaction_date', NEW.transaction_date,
      'tags', NEW.tags,
      'receipt_url', NEW.receipt_url,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at
    );
    
    -- Identify changed fields
    IF OLD.amount != NEW.amount THEN
      changed_fields_array := array_append(changed_fields_array, 'amount');
    END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      changed_fields_array := array_append(changed_fields_array, 'description');
    END IF;
    IF OLD.category_id != NEW.category_id THEN
      changed_fields_array := array_append(changed_fields_array, 'category');
    END IF;
    IF OLD.transaction_date != NEW.transaction_date THEN
      changed_fields_array := array_append(changed_fields_array, 'transaction_date');
    END IF;
    IF OLD.tags IS DISTINCT FROM NEW.tags THEN
      changed_fields_array := array_append(changed_fields_array, 'tags');
    END IF;
    IF OLD.receipt_url IS DISTINCT FROM NEW.receipt_url THEN
      changed_fields_array := array_append(changed_fields_array, 'receipt_url');
    END IF;
    
    -- Insert log entry (with error handling to not block main operation)
    BEGIN
      INSERT INTO public.expense_transaction_logs (
        transaction_id, action, user_name, category_name, 
        old_data, new_data, changed_fields, performed_by
      ) VALUES (
        NEW.id, 'UPDATE', user_name_val, category_name_val, 
        old_data_json, new_data_json, changed_fields_array, auth.uid()
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the main operation
      RAISE WARNING 'Failed to insert expense transaction log: %', SQLERRM;
    END;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'INSERT' THEN
    -- Get user and category names for the new record
    SELECT ep.full_name INTO user_name_val
    FROM public.expense_profile ep
    WHERE ep.user_id = NEW.user_id;
    
    SELECT ec.name INTO category_name_val
    FROM public.expense_categories ec
    WHERE ec.id = NEW.category_id;
    
    -- Build new data JSON with human-readable names
    new_data_json := jsonb_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'user_name', COALESCE(user_name_val, 'Unknown User'),
      'category_id', NEW.category_id,
      'category_name', COALESCE(category_name_val, 'Unknown Category'),
      'amount', NEW.amount,
      'description', NEW.description,
      'transaction_date', NEW.transaction_date,
      'tags', NEW.tags,
      'receipt_url', NEW.receipt_url,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at
    );
    
    -- Insert log entry (with error handling to not block main operation)
    BEGIN
      INSERT INTO public.expense_transaction_logs (
        transaction_id, action, user_name, category_name, 
        new_data, performed_by
      ) VALUES (
        NEW.id, 'INSERT', user_name_val, category_name_val, 
        new_data_json, auth.uid()
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the main operation
      RAISE WARNING 'Failed to insert expense transaction log: %', SQLERRM;
    END;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';