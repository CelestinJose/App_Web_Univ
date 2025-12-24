from django.db import models

class Etudiant(models.Model):
    """Profil d'étudiant avec informations supplémentaires"""
    
    # MODIFIÉ: Ajout du choix 'T' pour Triplant
    CODE_REDOUBLEMENT_CHOICES = [
        ('N', 'Non redoublant'),
        ('R', 'Redoublant'),
        ('T', 'Triplant')  # Nouveau code pour triplant
    ]
    
    BOURSIER_CHOICES = [
        ('OUI', 'Oui'),
        ('NON', 'Non')
    ]
    
    # Champs obligatoires
    matricule = models.CharField(max_length=50, unique=True)
    nom = models.CharField(max_length=50)
    prenom = models.CharField(max_length=50)
    niveau = models.CharField(max_length=15)
    code_redoublement = models.CharField(max_length=10, choices=CODE_REDOUBLEMENT_CHOICES)
    boursier = models.CharField(max_length=10, choices=BOURSIER_CHOICES)
    
    # Champs avec valeurs par défaut
    bourse = models.FloatField(default=0)
    numero_inscription = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # Champs optionnels
    date_naissance = models.DateField(null=True, blank=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    cin = models.CharField(max_length=12, blank=True, null=True)
    annee_bacc = models.CharField(max_length=4, blank=True, null=True)
    faculte = models.CharField(max_length=50, blank=True, null=True)
    domaine = models.CharField(max_length=50, blank=True, null=True)
    mention = models.CharField(max_length=100, blank=True, null=True, help_text="Ex: Informatique, Mathématiques, Physique, etc.")
    nationalite = models.CharField(max_length=50, default='Malagasy')
    photo = models.ImageField(upload_to='Etudiant/', null=True, blank=True)
    
    # AJOUT DES NOUVEAUX CHAMPS - NE MODIFIE PAS LE CODE EXISTANT
    lieu_naissance = models.CharField(max_length=100, blank=True, null=True, help_text="Lieu de naissance")
    email = models.EmailField(max_length=100, blank=True, null=True, help_text="Adresse email personnelle")
    nom_pere = models.CharField(max_length=100, blank=True, null=True, help_text="Nom complet du père")
    nom_mere = models.CharField(max_length=100, blank=True, null=True, help_text="Nom complet de la mère")
    # FIN DES AJOUTS
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Étudiant"
        verbose_name_plural = "Étudiants"
    
    def __str__(self):
        return f"Etudiant: {self.nom} {self.prenom}"
    
    # MODIFIÉ: Ajout d'une méthode pour afficher le code redoublement
    def get_code_redoublement_display(self):
        code_dict = dict(self.CODE_REDOUBLEMENT_CHOICES)
        return code_dict.get(self.code_redoublement, 'Inconnu')