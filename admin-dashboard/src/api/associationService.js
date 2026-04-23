import api from './axiosConfig';

/**
 * Obtém todas as associações
 */
export const getAllAssociations = async () => {
  try {
    const response = await api.get('/associations');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Fejl ved indlæsning af associationer:', error);
    throw error;
  }
};

/**
 * Obtém uma associação pelo ID
 */
export const getAssociationById = async (associationId) => {
  try {
    const response = await api.get(`/associations/${associationId}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar associação ${associationId}:`, error);
    throw error;
  }
};

/**
 * Vincula um contato a uma associação
 */
export const linkContactToAssociation = async (associationId, contactId) => {
  try {
    const response = await api.post(
      `/associations/${associationId}/contacts/${contactId}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Fejl ved tilknytning af kontakt ${contactId} til forening ${associationId}:`,
      error
    );
    throw error;
  }
};

/**
 * Desvincula um contato de uma associação
 */
export const unlinkContactFromAssociation = async (associationId, contactId) => {
  try {
    const response = await api.delete(
      `/associations/${associationId}/contacts/${contactId}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Erro ao desvincula contato ${contactId} da associação ${associationId}:`,
      error
    );
    throw error;
  }
};
