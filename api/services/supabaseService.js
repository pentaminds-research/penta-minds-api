const { supabase } = require('../config/supabase');
const { ApiError } = require('../middleware/errorHandler');

const memberColumns = [
  'id',
  'member_slug',
  'member_name',
  'role',
  'bio',
  'image_url',
  'linkedin_url',
  'initials',
  'is_associate',
  'team_type',       // "foundational" | "core" — used by frontend to split sections
  'display_order',
  'created_at',
  'updated_at'
].join(',');

const mapSupabaseError = (operation, error) => {
  if (!error) {
    return;
  }

  throw new ApiError(500, 'SUPABASE_ERROR', `${operation} failed.`, {
    message: error.message
  });
};

const getAllMembers = async () => {
  const { data, error } = await supabase
    .from('team_members')
    .select(memberColumns)
    .order('display_order', { ascending: true })
    .order('member_name', { ascending: true });

  mapSupabaseError('Fetching team members', error);
  return data || [];
};

const getMemberBySlug = async (slug) => {
  const { data, error } = await supabase
    .from('team_members')
    .select(memberColumns)
    .eq('member_slug', slug)
    .maybeSingle();

  mapSupabaseError('Fetching team member', error);
  return data;
};

const updateMemberImage = async (slug, imageUrl, publicId) => {
  const { data, error } = await supabase
    .from('team_members')
    .update({
      image_url: imageUrl,
      image_public_id: publicId,
      updated_at: new Date().toISOString()
    })
    .eq('member_slug', slug)
    .select(memberColumns)
    .single();

  mapSupabaseError('Updating member image', error);
  return data;
};

const clearMemberImage = async (slug) => {
  const { data, error } = await supabase
    .from('team_members')
    .update({
      image_url: null,
      image_public_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('member_slug', slug)
    .select(memberColumns)
    .single();

  mapSupabaseError('Clearing member image', error);
  return data;
};

module.exports = {
  getAllMembers,
  getMemberBySlug,
  updateMemberImage,
  clearMemberImage
};
