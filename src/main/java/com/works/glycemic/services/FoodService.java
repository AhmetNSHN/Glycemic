package com.works.glycemic.services;
import com.works.glycemic.config.AuditAwareConfig;
import com.works.glycemic.models.Foods;
import com.works.glycemic.repositories.FoodRepository;
import com.works.glycemic.utils.REnum;
import org.apache.commons.text.WordUtils;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class FoodService {

    final FoodRepository fRepo;
    final AuditAwareConfig auditAwareConfig;
    final CacheManager cacheManager;

    public FoodService(FoodRepository fRepo, AuditAwareConfig auditAwareConfig, CacheManager cacheManager) {
        this.fRepo = fRepo;
        this.auditAwareConfig = auditAwareConfig;
        this.cacheManager = cacheManager;
    }


    // food save
    public Foods foodsSave(Foods foods) {
        Optional<Foods> oFoods = fRepo.findByNameEqualsIgnoreCase(foods.getName());
        if (oFoods.isPresent()) {
            return null;
        } else {

            if ( auditAwareConfig.roles().contains("ROLE_admin") ) {
                foods.setEnabled(true);
            }
            else
            {
                foods.setEnabled(false);
            }

            String name = foods.getName().trim().replaceAll(" +", " ");
            foods.setName(WordUtils.capitalize(name));

            foods.setUrl(generateLink(name));
            return fRepo.save(foods);
        }
    }

    // food list
    public List<Foods> foodsList() {
        return fRepo.findByEnabledEqualsOrderByGidDesc(true);
    }



    // user food list
    public List<Foods> userFoodList() {
        Optional<String> oUserName = auditAwareConfig.getCurrentAuditor();
        if (oUserName.isPresent() ) {
            return fRepo.findByCreatedByEqualsIgnoreCase( oUserName.get() );
        }else {
            return new ArrayList<Foods>();
        }

    }


    @Transactional
    public Map<REnum, Object> foodDelete(long gid) {
        Map<REnum, Object> hm = new LinkedHashMap<>();
        hm.put(REnum.status, false);
        Optional<String> oUserName = auditAwareConfig.getCurrentAuditor();
        if (oUserName.isPresent()) {
            try {
                String userName = oUserName.get();
                if (auditAwareConfig.roles().contains("ROLE_admin")) {
                    // admin food delete
                    fRepo.deleteById(gid);
                    hm.put(REnum.status, true);
                    hm.put(REnum.message, "Silme i??lemi ba??ar??l??");
                } else {
                    // user food delete
                    Optional<Foods> oFoods = fRepo.findByCreatedByEqualsIgnoreCaseAndGidEquals(userName, gid);
                    if (oFoods.isPresent()) {
                        // user delete gid
                        fRepo.deleteById(gid);
                        hm.put(REnum.status, true);
                        hm.put(REnum.message, "Silme i??lemi ba??ar??l??");
                    } else {
                        hm.put(REnum.message, "Bu ??r??n size ait de??il");
                    }
                }
            } catch (Exception ex) {
                hm.put(REnum.message, "Silme i??lemi s??ras??nda bir hata olu??tu veya id hatal??!");
            }
        } else {
            hm.put(REnum.message, "Bu i??lem i??in yetkiniz yok!");
        }
        hm.put(REnum.result, gid);
        return hm;
    }


    //user update food
    public Map<REnum, Object> userUpdateFood(Foods food) {
        Map<REnum, Object> hm = new LinkedHashMap<>();

        hm.put(REnum.status, true);
        hm.put(REnum.message, "??r??n ba??ar??yla g??ncellendi");
        hm.put(REnum.result, "id: " + food.getGid());

        Optional<String> oUserName = auditAwareConfig.getCurrentAuditor();
        if (oUserName.isPresent()) {
            String userName = oUserName.get();
            try {
                Foods userFood = fRepo.findById(food.getGid()).get();
                //admin food update
                if (auditAwareConfig.roles().contains("ROLE_admin")) {
                    userFood.setCid(food.getCid());

                    String name = food.getName().trim().replaceAll(" +", " ");
                    userFood.setName(WordUtils.capitalize(name));
                    userFood.setGlycemicindex(food.getGlycemicindex());
                    userFood.setImage(food.getImage());
                    userFood.setSource(food.getSource());
                    userFood.setEnabled(food.isEnabled());
                    if ( food.isEnabled() ) {
                        cacheManager.getCache("foods_list").clear();
                    }
                    userFood.setUrl( generateLink(name) );
                    hm.put(REnum.result, fRepo.saveAndFlush(userFood));
                }
                else {
                    //user food update
                    Optional<Foods> oFood = fRepo.findByCreatedByEqualsIgnoreCaseAndGidEquals(userName,food.getGid());
                    if (oFood.isPresent()) {
                        userFood.setCid(food.getCid());
                        String name = food.getName().trim().replaceAll(" +", " ");
                        userFood.setName(WordUtils.capitalize(name));
                        userFood.setGlycemicindex(food.getGlycemicindex());
                        userFood.setImage(food.getImage());
                        userFood.setSource(food.getSource());
                        userFood.setUrl( generateLink(name) );
                        hm.put(REnum.result, fRepo.saveAndFlush(userFood));
                    }
                    else {
                        hm.put(REnum.status, false);
                        hm.put(REnum.message, "G??ncellemek istedi??iniz ??r??n size ait de??il!");
                    }
                }
            }
            catch (Exception ex) {
                hm.put(REnum.status, false);
                hm.put(REnum.message, "Update i??lemi s??ras??nda bir hata olu??tu!");
            }
        } else {
            hm.put(REnum.status, false);
            hm.put(REnum.message, "Bu i??leme yetkiniz yok!");
        }
        return hm;
    }

    public Foods getFood(String foodUrl) {
        Map<REnum, Object> hm = new LinkedHashMap<>();

        Optional<Foods> optFood = fRepo.findByUrl(foodUrl);
        if(optFood.isPresent())
        {
           return optFood.get();
        }
        else{
            return null;
        }

    }

    public List<Foods> adminWaitFoodList() {
        return fRepo.findByEnabledEqualsOrderByGidDesc(false);
    }

    public String generateLink(String s)
    {
        char[] turkishChars = new char[] {0x131, 0x130, 0xFC, 0xDC, 0xF6, 0xD6, 0x15F, 0x15E, 0xE7, 0xC7, 0x11F, 0x11E};
        char[] englishChars = new char[] {'i', 'I', 'u', 'U', 'o', 'O', 's', 'S', 'c', 'C', 'g', 'G'};
        for (int i = 0; i < turkishChars.length; i++) {
            s = s.trim().replaceAll(String.valueOf(turkishChars[i]), String.valueOf(englishChars[i]));
        }
        s = s.replaceAll(" +", "-").toLowerCase();
        return s;
    }
}



